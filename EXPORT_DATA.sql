-- Content OS Data Export
-- Run this in your Supabase SQL Editor to see the data
-- Copy the output and save as data-backup.sql

-- Export user_sources table
SELECT
  'user_sources' as table_name,
  jsonb_agg(jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'kind', kind,
    'name', name,
    'url', url,
    'enabled', enabled,
    'max_posts', max_posts,
    'note', note,
    'created_at', created_at
  )) as data
FROM user_sources;

-- Export content_posts table
SELECT
  'content_posts' as table_name,
  jsonb_agg(jsonb_build_object(
    'id', id,
    'source', source,
    'type', type,
    'title', title,
    'creator', creator,
    'date', date,
    'created_at', created_at,
    'likes', likes,
    'comments', comments,
    'reposts', reposts,
    'topic', topic,
    'why_it_worked', why_it_worked,
    'link', link,
    'content', content,
    'image_url', image_url,
    'author_image_url', author_image_url
  )) as data
FROM content_posts
ORDER BY created_at DESC;
