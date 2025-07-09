import { CorsOptions } from "cors";


export const corsConfig: CorsOptions = {
    origin: function (origin, callback) {
        const whileList = [process.env.FRONTEND_URL]
        if(process.argv[2] === '--api'){
            whileList.push(undefined)
        }
        if (whileList.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('ERROR DE CORS'))
        }
    }
}