import { Context } from 'koa';
import { Body } from '../../libs/Body';
import { Auth } from '../../libs/Auth';
import { OutfitManager } from './OutfitManager';
import { Outfit } from './OutfitEntity';
import { OutfitGarmentWrapperInterface } from '@osmo6/models';

export class OutfitController {
    private _manager: OutfitManager;

    constructor () {
        this._manager = new OutfitManager();
    }

    /**
     * Controller de création d'une tenue
     * @param {Context} ctx 
     */
    public async createOutfit (ctx: Context): Promise<void> {

        // Vérification de l'authentification de la requette
        const idUser: number = Number(ctx.request.body.user_id_user);
        if (!Auth.isValid(ctx, idUser)) {
            ctx.body = new Body(403, "Vous n'avez pas accès à ce contenu");
            return;
        }

        // Le tableau d'id des garments de la tenue
        const garms: number[] = ctx.request.body.id_garments;

        // On instancie un objet Outfit avec les bonnes infos
        const fit: Outfit = new Outfit({
            id_outfit: null,
            label_outfit: ctx.request.body.label_outfit,
            creation_date_outfit: Math.floor(Date.now() / 1000),
            modification_date_outfit: null,
            user_id_user: idUser
        });

        // On lance l'insert de de la tenues et des liens dans la table d'assoctiaation
        const res: (OutfitGarmentWrapperInterface|null) = await this._manager.insertOutfit(fit, garms);

        // Gestion des retours
        let status: number = res === null ? 400 : 200;
        let message: string = res === null 
            ? "Il y a eu un problème lors de la création de votre tenue, merci de réessayer" 
            : "Votre tenue a bien été créée";
        ctx.body = new Body(status, message, res);
        return;
    }

    /**
     * Permet de récupérer toutes les tenues d'un user
     * @param {Context} ctx 
     */
    public async getAllOutfitByUser (ctx: Context): Promise<void> {

        // Vérification de l'authentification de la requette
        const idUser: number = Number(ctx.params.idUser);
        if (!Auth.isValid(ctx, idUser)) {
            ctx.body = new Body(403, "Vous n'avez pas accès à ce contenu");
            return;
        }

        const fits: OutfitGarmentWrapperInterface[] = await this._manager.getOutfitsByIdUser(idUser);
        ctx.body = new Body(200, "OK", fits);
        return;
    }

    /**
     * Controller de suppression d'une tenue
     * @param {Context} ctx 
     */
    public async deleteOutfit (ctx: Context): Promise<void> {

        const idFit: number = Number(ctx.params.idOutfit);

        // Vérification de l'authentification de la requête
        const idUser: number = Number(ctx.params.idUser);
        if (!Auth.isValid(ctx, idUser)) {
            ctx.body = new Body(403, "Vous n'avez pas accès à ce contenu");
            return;
        }

        // On appelle le manager pour supprimer cette tenue en lui passant son id
        const res: boolean = await this._manager.deleteOufitById(idFit);

        // On fonction du résultat (true ou false), on renvoit le bon code HTTP ainsi qu'un message
        let status: number = res ? 200 : 400;
        let message: string = res 
            ? "La tenue a bien été supprimée" 
            : "Il y a eu un problème lors de la suppression de votre tenue, merci de réessayer";
        ctx.body = new Body(status, message, res);
        return;
    }

    /**
     * Met à jour un outfit
     * @param {Context} ctx 
     */
    public async updateOutfit (ctx: Context): Promise<void> {
        const body: any = ctx.request.body;
        const idUser: number = Number(body.user_id_user);
        const idOutfit: number = Number(body.id_outfit);
        const labelOutfit: string = body.label_outfit;
        const garms: number[] = body.id_garments;

        // Vérification de l'authentification de la requette
        if (!Auth.isValid(ctx, idUser)) {
            ctx.body = new Body(403, "Vous n'avez pas accès à ce contenu");
            return;
        }

        const datFit: (OutfitGarmentWrapperInterface|null) = await this._manager.getOutfitById(idOutfit);
        if (datFit !== null) {

            // On instancie un objet Outfit et on set les nouvelles valeurs
            const oFit: Outfit = new Outfit(datFit.outfit);
            oFit.setLabel(labelOutfit).setModificationDate(Math.floor(Date.now() / 1000));
            const res: (OutfitGarmentWrapperInterface|null) = await this._manager.updateOutfit(oFit, garms);

            // Gestion des retours
            const status: number = res === null ? 400 : 200;
            const message: string = res === null 
                ? "Il y a eu un problème lors de la mise à jour de votre tenue, merci de réessayer" 
                : "Votre tenue a bien été mise à jour";
            ctx.body = new Body(status, message, res);
            return;
        } else {
            ctx.body = new Body(403, "Cette tenue n'existe pas");
            return;
        }
    }

    /**
     * Permet de récupérer 3 ids pour générer une tenue aléatoire basée sur des filtres
     * @param {Context} ctx 
     */
    public async generateRandomOutfit (ctx: Context): Promise<void> {
        const idUser: number = Number(ctx.request.body.user_id_user);

        // onWhat : 1 => byStyle, 2 => byColor, 3 => bySeason
        const onWhat: number = Number(ctx.request.body.onWhat);

        // idWhat : l'id style / color / season pour lequel on veut récupérer le garm
        const idWhat: number = Number(ctx.request.body.whatId);

        // Vérification de l'authentification de la requette
        // if (!Auth.isValid(ctx, idUser)) {
        //     ctx.body = new Body(403, "Vous n'avez pas accès à ce contenu");
        //     return;
        // }

        // Contiendra la liste des id des vêtements
        let ids: number[] = [];

        // En fonction du filtre
        switch (onWhat) {

            // Style
            case 1:

                // On résout tout les appels directement, et on place les ids dans un tableau
                ids = await Promise.all([
                    this._manager.getRandomGarmByStyle(idWhat, idUser, 'top'),
                    this._manager.getRandomGarmByStyle(idWhat, idUser, 'pants'),
                    this._manager.getRandomGarmByStyle(idWhat, idUser, 'shoes')
                ]);
                break

            // Color
            case 2:
                ids = await Promise.all([
                    this._manager.getRandomGarmByColor(idWhat, idUser, 'top'),
                    this._manager.getRandomGarmByColor(idWhat, idUser, 'pants'),
                    this._manager.getRandomGarmByColor(idWhat, idUser, 'shoes')
                ]);
                break;

            // Season
            case 3:
                ids = await Promise.all([
                    this._manager.getRandomGarmBySeason(idWhat, idUser, 'top'),
                    this._manager.getRandomGarmBySeason(idWhat, idUser, 'pants'),
                    this._manager.getRandomGarmBySeason(idWhat, idUser, 'shoes')
                ]);
                break;

            default:
                ids = [0, 0, 0];
        }

        ctx.body = new Body(200, "Tenue générée ! N'oubliez pas d'ajouter un titre et de la sauvegarder", {...ids});
        return;
    }
}