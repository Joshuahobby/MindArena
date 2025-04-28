import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/io.dart';
import 'package:mind_arena/models/user_model.dart';
import 'package:mind_arena/services/auth_service.dart';

// Import html for web platform
import 'dart:html' if (dart.library.io) 'dart:io' as platform;

class WebSocketService with ChangeNotifier {
  WebSocketChannel? _channel;
  bool _isConnected = false;
  StreamSubscription? _subscription;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  final AuthService _authService;
  
  // Callback functions
  Function(Map<String, dynamic>)? onMessage;
  VoidCallback? onConnected;
  VoidCallback? onDisconnected;
  
  WebSocketService(this._authService) {
    // Listen for auth changes to connect/disconnect websocket
    _authService.addListener(_handleAuthChange);
    
    // Connect if already authenticated
    if (_authService.isAuthenticated) {
      connect();
    }
  }
  
  bool get isConnected => _isConnected;
  
  Future<void> connect() async {
    if (_isConnected) return;
    
    try {
      // Close any existing channel
      await _channel?.sink.close();
      
      // Determine the correct WebSocket URL based on the environment
      final wsUrl = _getWebSocketUrl();
      
      // Connect to the WebSocket server
      _channel = IOWebSocketChannel.connect(wsUrl);
      
      // Set up message listener
      _subscription = _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnect,
      );
      
      _isConnected = true;
      
      // Authenticate immediately if logged in
      _authenticateWebSocket();
      
      // Start heartbeat to keep connection alive
      _startHeartbeat();
      
      if (onConnected != null) {
        onConnected!();
      }
      
      notifyListeners();
    } catch (e) {
      print('WebSocket connection error: $e');
      _scheduleReconnect();
    }
  }
  
  Future<void> disconnect() async {
    _isConnected = false;
    
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    
    await _subscription?.cancel();
    _subscription = null;
    
    await _channel?.sink.close();
    _channel = null;
    
    if (onDisconnected != null) {
      onDisconnected!();
    }
    
    notifyListeners();
  }
  
  void send(Map<String, dynamic> message) {
    if (!_isConnected || _channel == null) {
      connect().then((_) {
        // Try again after connecting
        Future.delayed(const Duration(milliseconds: 500), () {
          send(message);
        });
      });
      return;
    }
    
    try {
      final jsonMessage = jsonEncode(message);
      _channel!.sink.add(jsonMessage);
    } catch (e) {
      print('Error sending WebSocket message: $e');
    }
  }
  
  void _handleMessage(dynamic message) {
    try {
      final Map<String, dynamic> data = jsonDecode(message);
      
      if (onMessage != null) {
        onMessage!(data);
      }
    } catch (e) {
      print('Error parsing WebSocket message: $e');
    }
  }
  
  void _handleError(dynamic error) {
    print('WebSocket error: $error');
    _scheduleReconnect();
  }
  
  void _handleDisconnect() {
    if (_isConnected) {
      _isConnected = false;
      
      if (onDisconnected != null) {
        onDisconnected!();
      }
      
      notifyListeners();
      _scheduleReconnect();
    }
  }
  
  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 3), () {
      if (_authService.isAuthenticated) {
        connect();
      }
    });
  }
  
  void _handleAuthChange() {
    if (_authService.isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
  }
  
  void _authenticateWebSocket() {
    if (!_isConnected || !_authService.isAuthenticated) return;
    
    final user = _authService.currentUser;
    if (user != null) {
      send({
        'type': 'auth',
        'userId': user.id,
        'username': user.username,
      });
    }
  }
  
  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (_isConnected) {
        send({
          'type': 'heartbeat',
        });
      }
    });
  }
  
  String _getWebSocketUrl() {
    // Determine the WebSocket URL based on the current environment
    String protocol = 'ws:';
    String host = 'localhost:5000';
    
    if (kIsWeb) {
      try {
        protocol = platform.window.location.protocol == 'https:' ? 'wss:' : 'ws:';
        host = platform.window.location.host;
      } catch (e) {
        print('Error getting web location: $e');
      }
    }
    
    return '$protocol//$host/ws';
  }
  
  @override
  void dispose() {
    _authService.removeListener(_handleAuthChange);
    disconnect();
    super.dispose();
  }
}