package com.spa;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;

public class SpaServer {
    // Siguraduhing tugma ang password ng standalone MySQL mo rito (hal. "1101")
    public static final String DB_URL = "jdbc:mysql://localhost:3306/spa_booking_db";
    public static final String DB_USER = "root";
    public static final String DB_PASS = "1101"; 

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        // MGA EXISTING CONTEXTS MO:
        server.createContext("/", new FileHandler());
        server.createContext("/submit-login", new LoginHandler());
        server.createContext("/submit-register", new RegisterHandler());
        
        // I-ADD ITONG TATLONG BAGONG LINYA PARA SA ADMIN CONTROLS:
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
       

        System.out.println("🚀 Spa Server nagsimula na sa http://localhost:8080");
        server.setExecutor(null); 
        server.start();
    }
    
}
