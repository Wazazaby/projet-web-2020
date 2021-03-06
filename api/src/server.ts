import * as Koa from 'koa';
import * as cors from 'koa-cors';
import * as logger from 'koa-logger';
import * as bodyParser from 'koa-bodyparser';
import * as DotEnv from 'dotenv';
import * as session from 'koa-session';

// L'instance de la connexion à la DB
import { Db } from './libs/Db';

// --------------- IMPORT ROUTES ---------------
// --------------- SERVING STATIC --------------
import staticServe from './libs/StaticServe';
// --------------- SERVING STATIC --------------
import userRooter from './main/user/UserRoutes';
import colorRooter from './main/color/ColorRoutes';
import garmentRooter from './main/garment/GarmentRoutes';
import seasonRooter from './main/season/SeasonRoutes';
import typeRooter from './main/type/TypeRoutes';
import styleRooter from './main/style/StyleRoutes';
import brandRooter from './main/brand/BrandRoutes';
import outfitRouter from './main/outfit/OutfitRoutes';
// --------------- IMPORT ROUTES ---------------


// Initialisation de l'app
const app: Koa = new Koa();

// Setup / initialisation des variables d'environnement
DotEnv.config();

// On passe les clés de signature de cookies à l'app
app.keys = [process.env.SECRET1, process.env.SECRET2, process.env.SECRET3];

// Gestion des CORS de l'app
app.use(cors({
    origin: process.env.SERVER_FRONT,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PATCH']
}));

// Utilisation du logger de Koa (pour voir les status des appels à l'API)
app.use(logger());

// Le bodyParser permet de gérer les données envoyées en POST depuis les formulaires
app.use(bodyParser());

// On ajoute la gestion de sessions à Koa, avec un cookie qui dure 1 jour
app.use(session({ maxAge: 86400000 }, app));

// -------------- ROUTES --------------
// Static
app.use(staticServe.routes());
app.use(staticServe.allowedMethods());

// User
app.use(userRooter.routes());
app.use(userRooter.allowedMethods());

// Color
app.use(colorRooter.routes());
app.use(colorRooter.allowedMethods());

// Garment
app.use(garmentRooter.routes());
app.use(garmentRooter.allowedMethods());

// Season
app.use(seasonRooter.routes());
app.use(seasonRooter.allowedMethods());

// Type
app.use(typeRooter.routes());
app.use(typeRooter.allowedMethods());

// Style
app.use(styleRooter.routes());
app.use(styleRooter.allowedMethods());

// Brand
app.use(brandRooter.routes());
app.use(brandRooter.allowedMethods());

// Outfit
app.use(outfitRouter.routes());
app.use(outfitRouter.allowedMethods());
// -------------- ROUTES --------------

// Lancement du serveur et initialisation de la BDD
app.listen(process.env.SERVER_PORT, () => console.log(`http://localhost:${process.env.SERVER_PORT}/api/`));
Db.init('http://localhost/phpmyadmin');