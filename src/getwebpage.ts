
export function getWebviewContent() {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Cat Coding</title>
		<style>
			.button {
			border: none;
			color: white;
			padding: 16px 32px;
			text-align: center;
			text-decoration: none;
			display: inline-block;
			font-size: 16px;
			margin: 4px 2px;
			transition-duration: 0.4s;
			cursor: pointer;
			}

			.button1 {
			background-color: white;
			color: black;
			border: 2px solid #4CAF50;
			}

			.button1:hover {
			background-color: #4CAF50;
			color: white;
			}

			.mydiv{
				white-space: pre-line;
			}
		</style>
	</head>
	<body>
		<div class="mydiv" id="editBox" contenteditable="true">
			Please select a document to show its information
		
		</div>
		<button class="button button1" onclick="setMessage()" >set</button>
		<br>

		<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
		<h1 id="lines-of-code-counter">0</h1>
			
		<script>
			const counter = document.getElementById('lines-of-code-counter');
			const editBox = document.getElementById('editBox');
	
			let count = 0;
			setInterval(() => {
				counter.textContent = count++;
			}, 100);
			const vscode = acquireVsCodeApi();
			function setMessage(){
				vscode.postMessage({
					command: 'log',
					text: editBox.textContent
				})
			}

			window.addEventListener('message', event => {

				const message = event.data; // The JSON data our extension sent
	
				switch (message.command) {
					case 'refactor':
						count = Math.ceil(count * 0.5);
						counter.textContent = count;
						break;
					case 'update':
						editBox.textContent = message.text;
						break;
				}
			});
		</script>
	</body>
	</html>`;
  }