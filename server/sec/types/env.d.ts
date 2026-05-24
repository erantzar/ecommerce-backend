declare namespace NodeJS {
    interface ProcessEnv {

    PORT: number
    MONGO_URI: string
    NODE_ENV: string
    JWT_SECRET: string
    CLOUDINARY_CLOUDE_NAME:string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_API_SECRET: string
    CLOUDINARY_URL: string
    EMAIL_USER: string
    EMAIL_PASS: string
    CORS_CLIENTS: string

}
}