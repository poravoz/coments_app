import React, { useEffect, useState } from "react";
import { CommentForm } from "../CommentForm/CommentForm";
import { ConfirmDialog } from "../ConfirmDialog/ConfirmDialog";
import { ActiveComment } from "../../types/types";
import { Comment } from "../Comment/Comment";
import { useCommentsStore } from "../../store/useCommentsStore";
import { useAuthStore } from "../../store/useAuthStore";
import "./Comments.css";
import { CommentType } from "../../types/commentType";

export const Comments = () =>  {
  const [activeComment, setActiveComment] = useState<ActiveComment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const commentsPerPage = 25;
  
  const { 
    comments: storeComments, 
    getComments, 
    createComment, 
    updateComment, 
    deleteComment, 
    removeAttachment,
    subscribeToComments,
    subscribeToUserUpdates,
    searchComments
  } = useCommentsStore();

  const { subscribeToAvatarUpdates } = useAuthStore();

  // Load comments
  const loadComments = () => {
    if (searchQuery.trim()) {
      searchComments(searchQuery, sortOrder);
    } else {
      getComments(sortOrder);
    }
  };

  // Subscribe to real-time updates and load initial comments
  useEffect(() => {
    getComments(sortOrder);
    
    const unsubscribeComments = subscribeToComments();
    const unsubscribeAvatars = subscribeToAvatarUpdates();
    const unsubscribeUserUpdates = subscribeToUserUpdates();
    
    return () => {
      unsubscribeComments();
      unsubscribeAvatars();
      unsubscribeUserUpdates(); 
    };
  }, []);

  // Reload comments when search query or sort order changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        loadComments();
        setCurrentPage(1);
      }, 300); 
      
      return () => clearTimeout(timeoutId);
    } else {
      loadComments();
      setCurrentPage(1);
    }
  }, [searchQuery, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); 
    loadComments();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOrder = e.target.value as "asc" | "desc";
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const addComment = (text: string, imageFile?: File, videoFile?: File, attachmentFile?: File, parentId: string | null = null, callback?: () => void) => {
    createComment(text, parentId, imageFile, videoFile, attachmentFile).then((newComment) => {
      if (callback) callback();
      loadComments();
    }).catch((error) => {
      console.error("Add comment failed:", error);
    });
  };

  const updateCommentHandler = (text: string, commentId: string, imageFile?: File, videoFile?: File, attachmentFile?: File) => {
    updateComment(commentId, text, imageFile, videoFile, attachmentFile).then(() => {
      setActiveComment(null);
      loadComments();
    }).catch((error) => {
      console.error("Update comment failed:", error);
    });
  };

  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setCommentToDelete(null);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;
    await deleteComment(commentToDelete);
    closeDeleteDialog();
    loadComments();
  };

  // Build comment tree
  const buildTree = (comments: CommentType[]): Map<string, CommentType[]> => {
    const tree = new Map<string, CommentType[]>();
        
    comments.forEach((comment) => {
      const parentId = comment.parentId || "root";
      
      if (!tree.has(parentId)) {
        tree.set(parentId, []);
      }
      tree.get(parentId)!.push(comment);
    });
    
    return tree;
  };

  // Get subtree size for pagination
  const getSubtreeSize = (commentId: string, tree: Map<string, CommentType[]>): number => {
    let size = 1;
    const children = tree.get(commentId) || [];
    children.forEach((child) => {
      size += getSubtreeSize(child.id, tree);
    });
    return size;
  };

  // Sort comments
  const sortedComments = [...storeComments].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  // Build tree and get root comments
  const tree = buildTree(sortedComments);
  const rootComments = tree.get("root") || [];

  // Pagination
  const pages: CommentType[][] = [];
  let currentPageComments: CommentType[] = [];
  let currentCount = 0;

  rootComments.forEach((root) => {
    const subtreeSize = getSubtreeSize(root.id, tree);
    if (currentCount + subtreeSize > commentsPerPage && currentPageComments.length > 0) {
      pages.push(currentPageComments);
      currentPageComments = [];
      currentCount = 0;
    }
    currentPageComments.push(root);
    currentCount += subtreeSize;
  });

  if (currentPageComments.length > 0) {
    pages.push(currentPageComments);
  }

  const totalPages = pages.length;
  const currentRoots = pages[currentPage - 1] || [];

  // Render comments recursively
  const renderComments = (parentId: string, depth: number) => {
    const children = tree.get(parentId) || [];

    return children.map((comment) => (
      <Comment
        key={comment.id}
        comment={comment}
        replies={renderComments(comment.id, depth + 1)}
        activeComment={activeComment}
        setActiveComment={setActiveComment}
        deleteComment={() => openDeleteDialog(comment.id)}
        addComment={addComment}
        updateComment={updateCommentHandler}
        removeAttachment={removeAttachment}
        depth={depth}
      />
    ));
  };

  return (
    <div className="comments-page">
      {/* Search and sort panel */}
      <div className="search-sort-panel-main">
        <form onSubmit={handleSearch} className="search-form-main">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comments..."
            className="search-input-main"
          />
          <button type="submit" className="search-button-main">
            Search
          </button>
          {searchQuery && (
            <button 
              type="button" 
              onClick={handleClearSearch}
              className="clear-search-button-main"
            >
              Clear
            </button>
          )}
        </form>

        <div className="sort-controls-main">
          <label htmlFor="sort-order">Sort by date:</label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={handleSortChange}
            className="sort-select-main"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Comment form */}
      <div className="comment-form-wrapper">
        <CommentForm submitLabel="Write" handleSubmit={addComment} />
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      )}

      {/* Comments container */}
      <div className="comments-container-wrapper">
        {currentRoots.length === 0 ? (
          <p>No comments {searchQuery ? "found for your search" : "on this page"}...</p>
        ) : (
          currentRoots.map((root) => (
            <Comment
              key={root.id}
              comment={root}
              replies={renderComments(root.id, 1)}
              activeComment={activeComment}
              setActiveComment={setActiveComment}
              deleteComment={() => openDeleteDialog(root.id)}
              addComment={addComment}
              updateComment={updateCommentHandler}
              removeAttachment={removeAttachment}
              depth={0}
            />
          ))
        )}
      </div>

      <ConfirmDialog open={dialogOpen} onClose={closeDeleteDialog} onConfirm={handleDelete} />
    </div>
  );
};