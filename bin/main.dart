void main(List<String> args) {
  final name = args[0];
  final label = args[1];
  final status = args[2];
  final color = args[3];
  final typeString = args[4];
  var path = args[5];

  final type = Type.fromPath(path, typeString);

  print('Make commit for badge:');
  print('name = $name');
  print('label = $label');
  print('status = $status');
  print('color = $color');
  print('\nLocation: $path');
  print('File type: $type');

  /*
  print('First is "${args[0]}" second is: "${args[0]}". This is:');
  print('${args.join(' ')}');

  print('Files:');

  final dir = Directory.current.absolute;
  print('Absolute: ${dir.path}');

  print('Items:\n${dir.listSync().map((entity) => entity.path).join(', ')}');

  print('Goodbye!');
  */
}

class Type {
  static const YAML = Type(['yaml', 'yml']);
  static const JSON = Type(['json']);

  static const List<Type> types = [YAML, JSON];

  final List<String> extensions;

  const Type(this.extensions);

  /// Gets the [Type] from a value such as "yaml" or "json". If the [data] is
  /// not either, it will to [fromString] to [orElse], which is [YAML] if
  /// invalid again.
  static Type fromString(String data, String orElse) {
    data = data.toLowerCase();
    return types.firstWhere((type) => type.extensions.contains(data), orElse: () => fromString(orElse, 'yaml'));
  }

  /// Gets the [Type] from the extension of a given file path. Invokes
  /// [fromString] after a substring.
  static Type fromPath(String data, String orElse) => fromString(data.substring(data.indexOf('.') + 1), orElse);

  @override
  String toString() {
    return 'Type{extensions: $extensions}';
  }
}
