# Pool Service

Pool Service is a Node.js project designed to query pool information from decentralized exchanges such as **Bluefin** and **FlowX**.

## Features

- Query pool information from Bluefin and FlowX
- Modular structure for easy extension to other exchanges
- Simple setup and usage

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

### Installation

Clone the repository and install dependencies:

```sh
git clone <repository-url>
cd pool-service
npm install
```

### Usage

To use the service, implement your logic in `index.js` (or your main entry file) to query pool information from Bluefin and FlowX.

Example:

```js
// Example usage (replace with actual implementation)
const bluefin = require('./src/bluefin');
const flowx = require('./src/flowx');

async function main() {
  const bluefinPools = await bluefin.getPools();
  const flowxPools = await flowx.getPools();
  console.log('Bluefin Pools:', bluefinPools);
  console.log('FlowX Pools:', flowxPools);
}

main();
```

## Scripts

- `npm test` – Run tests (currently not implemented)

## License

ISC

## Author

Nim