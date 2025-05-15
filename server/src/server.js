import express from 'express'
import authRoutes from './routes/auth/authRouter.js'
import postRoutes from './routes/post/postRouter.js'
import dotenv from 'dotenv'
import commentRoutes from './routes/comment/commentRouter.js'
import cors from 'cors'


const app = express();
const port = process.env.PORT | 3000;

dotenv.config();
app.use(cors());
app.use(express.json());


app.use('/auth', authRoutes);
app.use('/post', postRoutes);
app.use('/comment', commentRoutes);

app.listen(port,() => {
        console.log(`Server Start on port ${port}`)
    }
);