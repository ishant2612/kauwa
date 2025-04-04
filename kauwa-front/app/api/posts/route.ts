import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const postsFilePath = path.join(process.cwd(), "data", "posts.json");

const readPosts = () => {
  const data = fs.readFileSync(postsFilePath, "utf8");
  return JSON.parse(data);
};

const writePosts = (posts: any) => {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
};

export async function GET() {
  const posts = readPosts();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const { author, content, type, mediaUrl, verified } = await req.json(); // include 'verified'
  const newPost = {
    id: Date.now().toString(),
    author,
    content,
    type,
    mediaUrl,
    createdAt: new Date().toISOString(),
    voteCount: 0,
    verified: verified ?? false, // use verified from frontend, fallback to false if missing
  };

  const posts = readPosts();
  posts.push(newPost);
  writePosts(posts);

  return NextResponse.json(newPost, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, voteChange } = await req.json();
  let posts = readPosts();
  posts = posts.map((post: any) =>
    post.id === id ? { ...post, voteCount: post.voteCount + voteChange } : post
  );
  writePosts(posts);

  return NextResponse.json({ success: true });
}
