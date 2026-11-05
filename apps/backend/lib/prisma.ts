import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { config } from "../utils/config"

// Some hosts get an IPv6 route without real IPv6 connectivity. Bun then tries the
// database's IPv6 address first and hangs instead of falling back to IPv4.
// So we resolve the DB host to IPv4 ourselves and connect to that IP, while keeping
// the original hostname for TLS (SNI + certificate check), which Neon needs for routing.
async function buildPoolConfig(connectionString: string | undefined): Promise<PoolConfig> {
    if (!connectionString) return { connectionString };

    let url: URL;
    try {
        url = new URL(connectionString);
    } catch {
        return { connectionString };
    }

    const hostname = url.hostname;
    if (!hostname || isIP(hostname) || hostname === "localhost") {
        return { connectionString };
    }

    let ipv4: string;
    try {
        ({ address: ipv4 } = await lookup(hostname, { family: 4 }));
    } catch {
        return { connectionString };
    }

    // pg lets values parsed from the connection string override explicit options,
    // so swap the host into the string and drop sslmode, then set ssl explicitly.
    const sslmode = url.searchParams.get("sslmode");
    url.searchParams.delete("sslmode");
    url.hostname = ipv4;

    const ssl = sslmode && sslmode !== "disable"
        ? { servername: hostname } // verifies the cert against the real hostname
        : undefined;

    return { connectionString: url.toString(), ssl };
}

const pool = new Pool(await buildPoolConfig(config.DATABASE_URL))

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
    adapter
})

export { prisma }
