export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb, FieldValue } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/verifyAuth';

// Helper to check if caller is owner of shop or superadmin
async function isAuthorized(caller, shopId) {
  if (caller.role === 'superadmin' || caller.role === 'sub_superadmin') return true;
  if (caller.uid === shopId) return true;

  try {
    const shopDoc = await adminDb.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) return false;
    const data = shopDoc.data();
    return (
      data.ownerId === caller.uid ||
      data.ownerUid === caller.uid ||
      data.createdBy === caller.uid ||
      data.staffUids?.includes(caller.uid)
    );
  } catch (_) {
    return false;
  }
}

// ── GET: Fetch Categories ───────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID প্রয়োজন' }, { status: 400 });
    }

    const snap = await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('categories')
      .orderBy('createdAt', 'desc')
      .get();

    const categories = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error('[Categories API GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

// ── POST: Create Category ───────────────────────────────────────────
export async function POST(request) {
  try {
    const caller = await verifyAuth(request);
    const body = await request.json();
    const { shopId, name, subcategories = [] } = body;

    if (!shopId || !name?.trim()) {
      return NextResponse.json({ error: 'Shop ID এবং ক্যাটাগরির নাম দিন' }, { status: 400 });
    }

    const authorized = await isAuthorized(caller, shopId);
    if (!authorized) {
      return NextResponse.json({ error: 'আপনার এই স্টোরের ক্যাটাগরি তৈরি করার অনুমতি নেই' }, { status: 403 });
    }

    const cleanName = name.trim();
    const cleanSubs = Array.isArray(subcategories)
      ? subcategories.map(s => String(s).trim()).filter(Boolean)
      : [];

    const newDocRef = await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('categories')
      .add({
        name: cleanName,
        subcategories: cleanSubs,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

    return NextResponse.json({
      success: true,
      category: {
        id: newDocRef.id,
        name: cleanName,
        subcategories: cleanSubs
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[Categories API POST Error]:', error);
    return NextResponse.json({ error: error.message || 'ক্যাটাগরি তৈরি করতে ব্যর্থ' }, { status: 500 });
  }
}

// ── PUT: Edit / Rename Category & Cascade to Products ───────────────
export async function PUT(request) {
  try {
    const caller = await verifyAuth(request);
    const body = await request.json();
    const { shopId, categoryId, name, oldName, subcategories } = body;

    if (!shopId || !categoryId || !name?.trim()) {
      return NextResponse.json({ error: 'Shop ID, Category ID এবং নতুন নাম দিন' }, { status: 400 });
    }

    const authorized = await isAuthorized(caller, shopId);
    if (!authorized) {
      return NextResponse.json({ error: 'আপনার এই ক্যাটাগরি সম্পাদনা করার অনুমতি নেই' }, { status: 403 });
    }

    const cleanNewName = name.trim();
    const updatePayload = {
      name: cleanNewName,
      updatedAt: FieldValue.serverTimestamp()
    };

    if (Array.isArray(subcategories)) {
      updatePayload.subcategories = subcategories.map(s => String(s).trim()).filter(Boolean);
    }

    // 1. Update the category document in Firestore
    await adminDb
      .collection('shops')
      .doc(shopId)
      .collection('categories')
      .doc(categoryId)
      .update(updatePayload);

    // 2. Cascade rename to all products under the old category name
    let affectedProductCount = 0;
    if (oldName && oldName.trim().toLowerCase() !== cleanNewName.toLowerCase()) {
      const trimmedOld = oldName.trim();
      const pSnap = await adminDb
        .collection('shops')
        .doc(shopId)
        .collection('products')
        .where('category', '==', trimmedOld)
        .get();

      if (!pSnap.empty) {
        affectedProductCount = pSnap.size;
        const CHUNK = 300;
        const docs = pSnap.docs;
        for (let i = 0; i < docs.length; i += CHUNK) {
          const batch = adminDb.batch();
          docs.slice(i, i + CHUNK).forEach(pDoc => {
            batch.update(pDoc.ref, {
              category: cleanNewName,
              updatedAt: FieldValue.serverTimestamp()
            });
          });
          await batch.commit();
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে${affectedProductCount > 0 ? ` এবং ${affectedProductCount}টি পণ্যের ক্যাটাগরি নাম পরিবর্তন করা হয়েছে` : ''}`,
      category: {
        id: categoryId,
        name: cleanNewName,
        subcategories: updatePayload.subcategories || []
      },
      affectedProducts: affectedProductCount
    }, { status: 200 });
  } catch (error) {
    console.error('[Categories API PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'ক্যাটাগরি আপডেট ব্যর্থ' }, { status: 500 });
  }
}

// ── DELETE: Delete Single / Bulk Categories & Cascade or Reassign ────
export async function DELETE(request) {
  try {
    const caller = await verifyAuth(request);
    const body = await request.json();
    const {
      shopId,
      categoryId,
      categoryIds = [],
      deleteWithProducts = false,
      categoryNames = []
    } = body;

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID প্রয়োজন' }, { status: 400 });
    }

    const targetCategoryIds = categoryId ? [categoryId] : Array.isArray(categoryIds) ? categoryIds : [];
    if (targetCategoryIds.length === 0) {
      return NextResponse.json({ error: 'মুছে ফেলার জন্য অন্তত একটি ক্যাটাগরি আইডি দিন' }, { status: 400 });
    }

    const authorized = await isAuthorized(caller, shopId);
    if (!authorized) {
      return NextResponse.json({ error: 'আপনার এই স্টোরের ক্যাটাগরি মোছার অনুমতি নেই' }, { status: 403 });
    }

    // 1. Fetch category names if not provided
    const namesToDelete = new Set(
      Array.isArray(categoryNames) ? categoryNames.map(n => String(n).trim().toLowerCase()) : []
    );

    if (namesToDelete.size === 0) {
      for (const cId of targetCategoryIds) {
        const cDoc = await adminDb.collection('shops').doc(shopId).collection('categories').doc(cId).get();
        if (cDoc.exists) {
          const cName = cDoc.data()?.name;
          if (cName) namesToDelete.add(cName.trim().toLowerCase());
        }
      }
    }

    // 2. Handle products under these categories
    let affectedProductsCount = 0;
    if (namesToDelete.size > 0) {
      const pSnap = await adminDb.collection('shops').doc(shopId).collection('products').get();
      const matchingDocs = pSnap.docs.filter(doc => {
        const pCat = (doc.data()?.category || '').trim().toLowerCase();
        return namesToDelete.has(pCat);
      });

      affectedProductsCount = matchingDocs.length;
      if (matchingDocs.length > 0) {
        const CHUNK = 300;
        for (let i = 0; i < matchingDocs.length; i += CHUNK) {
          const batch = adminDb.batch();
          const chunk = matchingDocs.slice(i, i + CHUNK);
          chunk.forEach(pDoc => {
            if (deleteWithProducts) {
              batch.delete(pDoc.ref);
            } else {
              batch.update(pDoc.ref, {
                category: 'Uncategorized',
                updatedAt: FieldValue.serverTimestamp()
              });
            }
          });
          await batch.commit();
        }
      }
    }

    // 3. Delete category documents
    const CHUNK = 300;
    for (let i = 0; i < targetCategoryIds.length; i += CHUNK) {
      const batch = adminDb.batch();
      targetCategoryIds.slice(i, i + CHUNK).forEach(cId => {
        batch.delete(adminDb.collection('shops').doc(shopId).collection('categories').doc(cId));
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      deletedCount: targetCategoryIds.length,
      affectedProducts: affectedProductsCount,
      deleteWithProducts,
      message: `${targetCategoryIds.length}টি ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে`
    }, { status: 200 });
  } catch (error) {
    console.error('[Categories API DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'ক্যাটাগরি মোছা ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
