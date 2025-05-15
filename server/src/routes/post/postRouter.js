import { PrismaClient } from '@prisma/client';
import express from 'express';
import auth from '../../middleware/auth.js';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: true,
                comments: true
            }
        });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

router.get('/user', auth, async (req, res) => {
    try {
        const userPosts = await prisma.post.findMany({
            where: {
                authorId: req.user.id
            },
            include: {
                author: true,
                comments: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(userPosts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user posts" });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const post = await prisma.post.findUnique({
            where: {
                id: parseInt(req.params.id)
            },
            include: {
                author: true,
                comments: true
            }
        });
        
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch post" });
    }
});

router.post('/', auth, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
    }

    try {
        const newPost = await prisma.post.create({
            data: {
                title,
                content,
                author: {
                    connect: { id: req.user.id }
                }
            },
            include: {
                author: true
            }
        });
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: "Failed to create post" });
    }
});

router.put('/:id', auth, async (req, res) => {
    const { title, content } = req.body;
    const postId = parseInt(req.params.id);

    if (!title && !content) {
        return res.status(400).json({ error: "Please provide title or content to update" });
    }

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: "You can only update your own posts" });
        }

        const updatedPost = await prisma.post.update({
            where: {
                id: postId
            },
            data: {
                ...(title && { title }),
                ...(content && { content })
            },
            include: {
                author: true,
                comments: true
            }
        });
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ error: "Failed to update post" });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const postId = parseInt(req.params.id);

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { authorId: true }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: "You can only delete your own posts" });
        }

        await prisma.comment.deleteMany({
            where: {
                postId: postId
            }
        });

        await prisma.post.delete({
            where: {
                id: postId
            }
        });
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: "Failed to delete post" });
    }
});

export default router;