import { PrismaClient } from '@prisma/client';
import express from 'express';
import auth from '../../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/post/:postId', async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const comments = await prisma.comment.findMany({
            where: {
                postId: postId
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch comments for this post" });
    }
});

router.post('/', auth, async (req, res) => {
    const { postId, text } = req.body;
    const userId = req.user.id;

    if (!postId || !text) {
        return res.status(400).json({ error: "postId and text are required" });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = await prisma.comment.create({
            data: {
                text,
                post: {
                    connect: { id: parseInt(postId) }
                },
                author: {
                    connect: { id: userId }
                }
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                post: {
                    select: {
                        id: true
                    }
                }
            }
        });

        const formattedComment = {
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            author: comment.author,
            postId: comment.post.id
        };

        res.status(201).json(formattedComment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: "Failed to create comment" });
    }
});

router.get('/', async (req, res) => {
    const comments = await prisma.comment.findMany();
    res.json(comments);
});

router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const {text} = req.body;
    const userId = req.user.id;

    try {
        const updatedComment = await prisma.comment.update({
            where: {
                id: parseInt(id),
                authorId: userId
            },
            data: {
                text
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })
        if(!updatedComment) 
        {
            return res.status(404).json({ error: "Comment not found" });
        }
        res.json(updatedComment);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update comment" });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(id) },
            include: {
                post: {
                    select: {
                        authorId: true
                    }
                }
            }
        });

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.authorId !== userId && comment.post.authorId !== userId) {
            return res.status(403).json({ error: "Not authorized to delete this comment" });
        }

        const deletedComment = await prisma.comment.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: "Failed to delete comment" });
    }
});

export default router;