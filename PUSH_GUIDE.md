# GitHub Private Repo Push Guide

## সমস্যা কেন হয়?
Private repo-তে push করতে GitHub Personal Access Token (PAT) লাগে।
Windows এ Git Credential Manager আছে, কিন্তু মাঝে মাঝে token expire হয়ে যায়।

## সমাধান: PAT দিয়ে Remote URL আপডেট করুন

1. GitHub এ যান: https://github.com/settings/tokens
2. "Generate new token (classic)" এ ক্লিক করুন
3. Note: "webmaa-push", Expiration: 1 year
4. Scope: শুধু `repo` চেক করুন
5. Generate করুন এবং token কপি করুন (ghp_...)

6. নিচের command চালান (YOUR_TOKEN এর জায়গায় আপনার token দিন):

```
git remote set-url origin https://YOUR_TOKEN@github.com/amarbazar27/webmaa.git
```

7. এরপর push করুন:
```
git push origin main
```

## Alternative: GitHub CLI
```
winget install GitHub.cli
gh auth login
gh auth status
```

## Note
- Repo private থাকলেও Antigravity (AI) push করতে পারবে
- শুধু প্রথমবার setup করে দিলেই হবে
- Token expire হলে আবার setup করুন
