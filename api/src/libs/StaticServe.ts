import * as Router from 'koa-router';
import * as serve from 'koa-send';
import { Context, DefaultState } from 'koa';

const router: Router<DefaultState, Context> = new Router<DefaultState, Context>();

router.get(
    
    // Match n'importe quelle url qui commence par /uploads/... 
    '/uploads/(.*)',

    // On renvoit les images et on les stock dans le cache pendant 3 mois
    async (ctx: Context): Promise<string> => serve(ctx, ctx.path, { maxAge: 7889400000 })
);

export default router;