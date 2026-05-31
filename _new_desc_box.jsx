        {/* ── Banner Description Box (Retailer Customizable) ── */}
        <div
          className="rounded-2xl shadow-sm border overflow-hidden"
          style={{
            borderColor: shop?.descBoxBorderColor || 'var(--sp-border, #e2e8f0)',
            background: shop?.descBoxBg || 'var(--sp-card, #ffffff)',
          }}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 to-blue-600" />
          <div className="p-5 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {shop?.logoUrl && (
                <div className="shrink-0 hidden md:block">
                  <img src={shop.logoUrl} alt={shop.shopName} className="w-16 h-16 object-contain rounded-2xl border p-1 border-slate-200" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-black tracking-tight mb-2 text-slate-900">
                  {shop?.shopName || ''}
                </h1>
                <p className="text-sm md:text-base font-medium leading-relaxed whitespace-pre-line text-slate-600">
                  {shop?.bannerDescription || shop?.description || shop?.slogan || ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(shop?.descBoxBadges?.length > 0
                    ? shop.descBoxBadges
                    : ['\u2705 \u09a6\u09cd\u09b0\u09c1\u09a4 \u0985\u09b0\u09cd\u09a1\u09be\u09b0', '\ud83d\udd12 \u09a8\u09bf\u09b0\u09be\u09aa\u09a6 \u09aa\u09c7\u09ae\u09c7\u09a8\u09cd\u099f', '\ud83d\udce6 \u09ae\u09be\u09a8\u09b8\u09ae\u09cd\u09aa\u09a8\u09cd\u09a8 \u09aa\u09a3\u09cd\u09af']
                  ).map((badge, bi) => (
                    <span key={bi}
                      className="inline-flex items-center px-3 py-1 text-xs font-black rounded-lg border bg-purple-50 text-purple-700 border-purple-200">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
