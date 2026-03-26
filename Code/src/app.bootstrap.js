import { NODE_ENV, port } from "../config/config.service.js";
import { globalErrorHandling } from "./common/utils/response/index.js";
import { connectDB, connectRedis, redisClient } from "./DB/index.js";
import { authRouter, messageRouter, userRouter } from "./modules/index.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { resolve } from "node:path";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import geoipLight from "geoip-lite";

async function bootstrap() {
  const app = express();

  const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit: function limit(req) {
      const countryIp = geoipLight.lookup(req.ip).country;
      return countryIp === "EG" ? 4 : 0;
    },
    legacyHeaders: true,
    standardHeaders: "draft-8",
    skipFailedRequests: true,
    skipSuccessfulRequests:true,
    handler: (req, res, next) => {
      return res.status(429).json({ message: "Too Many Requests" });
    },
    keyGenerator: function (req, res, next) {
      // console.log(req.ip)
      const ipV6 = ipKeyGenerator(req.ip, 56);
      //   console.log(ipV6);

      return `${ipV6}-${req.path}`;
    },
    store: {
      increment: async function (key) {
        // get called by express-rate-limit
        try {
          const count = await redisClient.incr(key);
          if (count === 1) await redisClient.expire(key, 120); // 2 min TTL
          return { totalHits: count, resetTime: undefined };
        } catch (err) {
          console.error("Redis Error:", err);
          return { totalHits: 1, resetTime: undefined };
        }
      },

      decrement: async function (key) {
        // called by skipFailedRequests:true ,  skipSuccessfulRequests:true,
        await redisClient.decr(key);
      },

      resetKey: async function (key) {
        await redisClient.del(key);
      },
    },
  });
    
    app.set("trust proxy" , true)

  //convert buffer data
  app.use(cors(), helmet(), limiter, express.json());
  app.use("/uploads", express.static(resolve("../uploads")));

  // DB
  await connectDB();
  await connectRedis();

  app.get("/", (req, res) => res.send("Hello World!"));
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/message", messageRouter);
  app.use("/uploads", express.static("uploads"));

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });

  //global error handling
  app.use(globalErrorHandling);

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
export default bootstrap;
