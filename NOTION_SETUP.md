# Export Posts to Notion

Share your 1,000 posts with others via a Notion database.

---

## **Setup (5 minutes)**

### **Step 1: Create Notion Integration**

1. Go to https://www.notion.so/my-integrations
2. Click **New Integration**
3. Name it: "Content OS"
4. Click **Create**
5. Copy the **Internal Integration Token**
6. Add to `.env.local`:
   ```
   NOTION_API_KEY=ntn_xxxxx...
   ```

### **Step 2: Create Notion Database**

1. Go to your Notion workspace
2. Create a new page
3. Add a database (Table view)
4. Let it be empty (we'll populate it)
5. Copy the database ID from the URL:
   ```
   https://notion.so/yourworkspace/DATABASE_ID?v=...
   ```
6. Add to `.env.local`:
   ```
   NOTION_DATABASE_ID=database_id_here
   ```

### **Step 3: Grant Access**

1. Open your Notion database
2. Click **Share** (top right)
3. Click **Invite**
4. Search for your integration name ("Content OS")
5. Grant access

---

## **Run the Export**

```bash
npx ts-node scripts/export-to-notion.ts
```

**Expected output:**
```
📖 Reading posts export...
📤 Found 1000 posts. Uploading to Notion...
⏳ This may take a minute...

✅ Upload complete!
📊 Uploaded: 1000/1000
🔗 View your Notion database: https://notion.so/DATABASE_ID
```

---

## **Share with Others**

### **Option 1: Share the Notion Link**
1. Open your Notion database
2. Click **Share** (top right)
3. Click **Copy link**
4. Send to Moataz
5. ✅ He can view all 1,000 posts

### **Option 2: Duplicate to Shared Workspace**
1. Open database
2. Click **⋯** (top right)
3. Click **Duplicate**
4. Duplicate to shared workspace
5. Share with Moataz

---

## **Database Schema**

Notion database will have these columns:

| Column | Type | Example |
|--------|------|---------|
| Title | Text | "How to Get Your First 10 Customers" |
| Creator | Text | "Y Combinator" |
| Source | Select | LinkedIn, Reddit, Instagram, YouTube |
| Type | Select | Story, Hot take, Educational |
| Likes | Number | 225 |
| Comments | Number | 13 |
| Link | URL | https://linkedin.com/feed/... |
| Published | Date | 2026-06-22 |

---

## **Troubleshooting**

**"Missing NOTION_API_KEY"**
- Go to https://www.notion.so/my-integrations
- Create new integration
- Copy token to `.env.local`

**"Missing NOTION_DATABASE_ID"**
- Open your Notion database
- Copy ID from URL: `notion.so/COPY_THIS_PART?v=...`
- Add to `.env.local`

**"Access denied"**
- Go to Notion database
- Click Share → Search for your integration
- Click to add it

**"Upload failed"**
- Check API key is correct
- Check database ID is correct
- Verify integration has access to database
- Try again (uploads can be retried)

---

## **Sharing with Moataz**

Once uploaded to Notion:

1. **He can view posts** in Notion database
2. **He can filter/search** posts
3. **He downloads `posts-export.json`** to import into his Supabase
4. **He runs his own Content OS** with the posts

---

## **Next Steps**

1. ✅ Upload posts to Notion: `npx ts-node scripts/export-to-notion.ts`
2. ✅ Share Notion link with Moataz
3. ✅ Send him MOATAZ_SETUP.md (setup guide)
4. ✅ Send him posts-export.json (for import)
5. ✅ He's ready to start!
