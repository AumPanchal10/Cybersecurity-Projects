from flask import Flask, jsonify

app = Flask(__name__)

# Example API route
@app.route('/api/<word>', methods=['GET'])
def api(word):
    if word == "test":
        return jsonify({"message": "Success!", "word": word}), 200
    else:
        return jsonify({"error": "Not found"}), 404

if __name__ == "__main__":
    # Run the server on port 8080
    app.run(host="0.0.0.0", port=8080)
