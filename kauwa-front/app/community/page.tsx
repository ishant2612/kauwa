"use client";
import { useEffect, useState } from "react";

type Post = {
  id: string;
  author: string;
  content: string;
  type: "text" | "image" | "video";
  mediaUrl?: string;
  createdAt: string;
  voteCount: number;
  verified: boolean | null; // Updated to support verification status
};

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({
    author: "",
    content: "",
    type: "text",
    mediaUrl: "",
  });
  const [verifying, setVerifying] = useState(false); // Spinner state

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.sort((a: Post, b: Post) => b.voteCount - a.voteCount));
        setLoading(false);
      });
  }, []);

  const vote = async (id: string, voteChange: number) => {
    await fetch("/api/posts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, voteChange }),
    });

    setPosts((prev) =>
      prev
        .map((post) =>
          post.id === id
            ? { ...post, voteCount: post.voteCount + voteChange }
            : post
        )
        .sort((a, b) => b.voteCount - a.voteCount)
    );
  };

  const addPost = async () => {
    if (!newPost.author.trim() || !newPost.content.trim()) return;

    let verifiedStatus: boolean | null = null;

    if (newPost.type === "text") {
      setVerifying(true);
      try {
        const verifyRes = await fetch("http://127.0.0.1:5000/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: newPost.content }),
        });

        const verifyData = await verifyRes.json();
        console.log(
          "Verification response:",
          verifyData,
          verifyData.result,
          verifyData.result[0]
        );
        verifiedStatus = verifyData.result[0] ?? null;
        console.log(verifiedStatus);
      } catch (error) {
        console.error("Verification failed:", error);
      }
      setVerifying(false);
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPost, verified: verifiedStatus }),
    });

    const data = await res.json();
    setPosts((prev) =>
      [data, ...prev].sort((a, b) => b.voteCount - a.voteCount)
    );
    setNewPost({ author: "", content: "", type: "text", mediaUrl: "" });
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Loading posts...</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-3xl font-bold p-4 rounded-lg shadow-md text-center">
        🗣️ Community
      </div>

      {/* New Post Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-10 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          Create a Post
        </h2>
        <input
          type="text"
          placeholder="Your name"
          value={newPost.author}
          onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
          className="w-full mb-3 px-4 py-2 border text-gray-800 border-gray-300 rounded"
        />
        <input
          type="text"
          placeholder="Post content"
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          className="w-full mb-3 px-4 py-2 border text-gray-800 border-gray-300 rounded"
        />
        <select
          value={newPost.type}
          onChange={(e) =>
            setNewPost({
              ...newPost,
              type: e.target.value as "text" | "image" | "video",
            })
          }
          className="w-full mb-3 px-4 py-2 border text-gray-800 border-gray-300 rounded"
        >
          <option value="text">Text</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        {newPost.type !== "text" && (
          <input
            type="text"
            placeholder="Media URL"
            value={newPost.mediaUrl}
            onChange={(e) =>
              setNewPost({ ...newPost, mediaUrl: e.target.value })
            }
            className="w-full mb-3 px-4 py-2 border text-gray-800 border-gray-300 rounded"
          />
        )}
        <button
          onClick={addPost}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-900 transition"
          disabled={verifying}
        >
          {verifying ? "Verifying..." : "Post"}
        </button>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <p className="text-center text-gray-500">
          No posts yet. Be the first to post!
        </p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{post.author}</h3>
              <span className="text-sm text-gray-400">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-700 mb-3">{post.content}</p>

            {post.type === "image" && post.mediaUrl && (
              <img
                src={post.mediaUrl}
                alt="Post image"
                className="rounded mb-3 max-h-64 object-cover"
              />
            )}
            {post.type === "video" && post.mediaUrl && (
              <video
                src={post.mediaUrl}
                controls
                className="rounded mb-3 max-h-64 w-full"
              />
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => vote(post.id, 1)}
                  className="text-green-600 hover:text-green-800 transition"
                >
                  👍
                </button>
                <button
                  onClick={() => vote(post.id, -1)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  👎
                </button>
                <span className="text-gray-600 text-sm">
                  Votes: {post.voteCount}
                </span>
              </div>
              {post.verified !== null && (
                <span
                  className={`text-sm font-semibold ${
                    post.verified ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {post.verified ? "✅ Verified" : "❌ Not Verified"}
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
