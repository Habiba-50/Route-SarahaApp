
import { NODE_ENV, port } from '../config/config.service.js'
import { golbalErrorHandeling } from './common/utils/response/index.js'
import { connectDB } from './DB/index.js'
import { authRouter, userRouter } from './modules/index.js'
import express from 'express'

async function bootstrap() {
    const app = express()
    //convert buffer data
    app.use(express.json())

    // DB
    await connectDB()

    //application routing
    app.get('/', (req, res) => res.send('Hello World!'))
    app.use('/auth', authRouter)
    app.use('/user', userRouter)


    //invalid routing
    app.use('{/*dummy}', (req, res) => {
        return res.status(404).json({ message: "Invalid application routing" })
    })

    //global error handling
    app.use(golbalErrorHandeling)
    
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}
export default bootstrap