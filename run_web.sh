#!/bin/bash

# Build the Flutter web app
flutter build web --web-renderer html

# Create a simple server configuration for serving Flutter web app correctly
mkdir -p web_server
cat > web_server/server.dart << 'EOF'
import 'dart:async';
import 'dart:io';

Future<void> main() async {
  final server = await HttpServer.bind('0.0.0.0', 5000);
  print('Server running on port ${server.port}');

  await for (final request in server) {
    try {
      final path = request.uri.path == '/' ? '/index.html' : request.uri.path;
      final file = File('build/web$path');
      
      if (await file.exists()) {
        // Set proper MIME types based on file extension
        String contentType;
        if (path.endsWith('.html')) {
          contentType = 'text/html';
        } else if (path.endsWith('.js')) {
          contentType = 'application/javascript';
        } else if (path.endsWith('.css')) {
          contentType = 'text/css';
        } else if (path.endsWith('.png')) {
          contentType = 'image/png';
        } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (path.endsWith('.svg')) {
          contentType = 'image/svg+xml';
        } else if (path.endsWith('.json')) {
          contentType = 'application/json';
        } else if (path.endsWith('.woff') || path.endsWith('.woff2')) {
          contentType = 'font/woff';
        } else if (path.endsWith('.ttf')) {
          contentType = 'font/ttf';
        } else {
          contentType = 'application/octet-stream';
        }
        
        request.response.headers.contentType = ContentType.parse(contentType);
        request.response.statusCode = HttpStatus.ok;
        await request.response.addStream(file.openRead());
      } else {
        // Try to find a default file if it's a path without extension
        // This handles routes in the Flutter app
        if (!path.contains('.')) {
          final indexFile = File('build/web/index.html');
          if (await indexFile.exists()) {
            request.response.headers.contentType = ContentType.html;
            request.response.statusCode = HttpStatus.ok;
            await request.response.addStream(indexFile.openRead());
          } else {
            request.response.statusCode = HttpStatus.notFound;
            request.response.write('File not found');
          }
        } else {
          request.response.statusCode = HttpStatus.notFound;
          request.response.write('File not found');
        }
      }
    } catch (e) {
      print('Error handling request: $e');
      request.response.statusCode = HttpStatus.internalServerError;
      request.response.write('Internal server error');
    } finally {
      await request.response.close();
    }
  }
}
EOF

# Compile the server
dart compile exe web_server/server.dart -o web_server/server

# Run the server
./web_server/server