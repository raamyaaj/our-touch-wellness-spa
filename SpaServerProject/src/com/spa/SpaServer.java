package com.spa;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class SpaServer {
    // 🌟 AUTOMATIC CLOUD OR LOCAL DATABASE DETECTION CONFIGURATION
    public static final String DB_URL;
    public static final String DB_USER;
    public static final String DB_PASS; 

    static {
        // Kukunin ang reference variables mula sa environment properties dashboard ng Railway
        String cloudHost = System.getenv("MYSQLHOST");
        String cloudPort = System.getenv("MYSQLPORT");
        String cloudDatabase = System.getenv("MYSQLDATABASE");
        String cloudUser = System.getenv("MYSQLUSER");
        String cloudPassword = System.getenv("MYSQLPASSWORD");

        if (cloudHost != null) {
            // Kung tumatakbo sa Railway (Online Cloud Database)
            DB_URL = "jdbc:mysql://" + cloudHost + ":" + cloudPort + "/" + cloudDatabase;
            DB_USER = cloudUser;
            DB_PASS = cloudPassword;
        } else {
            // Kung tumatakbo sa PC mo (Local Backup Configuration Data)
            DB_URL = "jdbc:mysql://localhost:3306/spa_booking_db";
            DB_USER = "root";
            DB_PASS = "1101"; 
        }
    }

    public static void main(String[] args) throws Exception {
        // 🌟 AUTOMATIC PORT ASSIGNMENT FOR CLOUD ROUTING
        String portEnv = System.getenv("PORT");
        int port = (portEnv != null) ? Integer.parseInt(portEnv) : 8080;
        
        // Gagamit ng "0.0.0.0" upang tanggapin ang external public connections online sa internet
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
        
        // MGA EXISTING CONTEXTS MO (Walang nabago rito):
        server.createContext("/", new FileHandler());
        server.createContext("/submit-login", new LoginHandler());
        server.createContext("/submit-register", new RegisterHandler());
        
        server.createContext("/admin/get-users", new AdminDataHandler());
        server.createContext("/admin/revoke-user", new AdminDataHandler());
        server.createContext("/admin/get-schedules", new AdminDataHandler());
        server.createContext("/api/get-services", new ServicesCatalogHandler());
        server.createContext("/api/get-promos", new PromosCatalogHandler());
        server.createContext("/api/create-booking", new CreateBookingHandler());
        server.createContext("/admin/get-audit-logs", new AuditLogsHandler());
        server.createContext("/admin/add-service", new AdminServicesCRUDHandler());
        server.createContext("/admin/toggle-user-status", new AdminDataHandler());
        server.createContext("/admin/update-booking-status", new AdminDataHandler());
        server.createContext("/admin/create-booking", new AdminCreateBookingHandler());
        server.createContext("/api/recover-password", new RecoverPasswordHandler());

        System.out.println("🚀 Spa Server nagsimula na sa port: " + port);
        server.setExecutor(null); 
        server.start();
    }
}
