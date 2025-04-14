import express from "express";
import cors from "cors";
import routes from "./routes.js";
import setupSwagger from './config/swagger.js';



const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);


export default app;
setupSwagger(app);