import 'package:flutter/material.dart';
import 'dart:developer' as developer;

void main() {
  developer.log('MindArena starting...');
  runApp(const MindArenaApp());
}

class MindArenaApp extends StatelessWidget {
  const MindArenaApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    developer.log('Building MindArenaApp');
    return MaterialApp(
      title: 'MindArena',
      debugShowCheckedModeBanner: true,
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key}) : super(key: key);

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  int _counter = 0;

  void _incrementCounter() {
    developer.log('Incrementing counter');
    setState(() {
      _counter++;
    });
  }

  @override
  Widget build(BuildContext context) {
    developer.log('Building MyHomePage');
    return Scaffold(
      appBar: AppBar(
        title: const Text('MindArena Demo'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'Welcome to MindArena!',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            const Text(
              'You have pushed the button this many times:',
            ),
            Text(
              '$_counter',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _incrementCounter,
        tooltip: 'Increment',
        child: const Icon(Icons.add),
      ),
    );
  }
}
