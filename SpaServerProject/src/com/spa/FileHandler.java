package com.spa;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;

public class FileHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if (path.equals("/")) path = "/login.html";
        
        File file = new File("web" + path);
        if (file.exists() && !file.isDirectory()) {
            byte[] bytes = Files.readAllBytes(Paths.get(file.getPath()));
            
            if (path.endsWith(".css")) exchange.getResponseHeaders().set("Content-Type", "text/css");
            else if (path.endsWith(".js")) exchange.getResponseHeaders().set("Content-Type", "application/javascript");
            else if (path.endsWith(".html")) exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");

            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        } else {
            String error = "404 File Not Found";
            exchange.sendResponseHeaders(404, error.length());
            OutputStream os = exchange.getResponseBody();
            os.write(error.getBytes());
            os.close();
        }
    }
}
