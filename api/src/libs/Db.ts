import { Pool, createPool } from 'mysql2/promise';

class Connection {
    public pool: Pool;

    async init (): Promise<void> {
        const connection: Pool = await createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 20,
            queueLimit: 0
        });

        this.pool = connection;
    }
}

export const Db: Connection = new Connection();