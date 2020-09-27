
const cats = {
	'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
	'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif'
};

export function getWebviewContent(cat: keyof typeof cats) {
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
		</style>
	</head>
	<body>
		<div contenteditable="true">
			This text can be edited by the user.
		</div>
		<button class="button button1" onclick="setMessage()" >set</button>

		
		<img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
		<h1 id="lines-of-code-counter">0</h1>
			
		<script>
			const counter = document.getElementById('lines-of-code-counter');
	
			let count = 0;
			setInterval(() => {
				counter.textContent = count++;
			}, 100);
			const vscode = acquireVsCodeApi();
			function setMessage(){
				vscode.postMessage({
					command: 'alert',
					text: '🐛  on line ' + count
				})
			}
		</script>
	</body>
	</html>`;
  }