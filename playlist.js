this.loadPlaylists = function(client, file) {
	client.fs.readFile(file, 'utf8' , (err, data) => {
		if (err) {
			console.error(err);
			return;
		}
		client.playlists.list = data;
	});
}

this.savePlaylists = function(client, file) {
	var jsonContent = JSON.stringify(client.playlists.list);
	console.log(jsonContent);

	client.fs.writeFile(file, client.playlists.list, 'utf8', function (err) {
		if (err) {
			console.log("An error occured while writing JSON Object to File.");
			return console.log(err);
		}
 
		console.log("JSON file has been saved.");
	});
}