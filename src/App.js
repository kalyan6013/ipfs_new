import {Table, Grid, Button, Form } from 'react-bootstrap';
import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
import web3 from './web3';
import ipfs from './ipfs';
import storehash from './storehash';

class App extends Component {
 
    state = {
      ipfsHash:null,
      buffer:'',
      ethAddress:'',
      blockNumber:'',
      transactionHash:'',
      gasUsed:'',
      txReceipt: '',
      responseDoc:'',
      listItem:[],
      listItems:[],
      i:'',
      j:'',
      liItem:[],
      liItems:[]
    };


    captureFile =(event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)    
      };

    convertToBuffer = async(reader) => {
      //file is converted to a buffer to prepare for uploading to IPFS
        const buffer = await Buffer.from(reader.result);
      //set this buffer -using es6 syntax
        this.setState({buffer});
    };

    onClick = async () => {

    try{
        this.setState({blockNumber:"waiting.."});
        this.setState({gasUsed:"waiting..."});

        // get Transaction Receipt in console on click
        // See: https://web3js.readthedocs.io/en/1.0/web3-eth.html#gettransactionreceipt
        await web3.eth.getTransactionReceipt(this.state.transactionHash, (err, txReceipt)=>{
          console.log(err,txReceipt);
          this.setState({txReceipt});
        }); //await for getTransactionReceipt

        await this.setState({blockNumber: this.state.txReceipt.blockNumber});
        await this.setState({gasUsed: this.state.txReceipt.gasUsed});    
      } //try
    catch(error){
        console.log(error);
      } //catch

      var request = new Request(`https://gateway.ipfs.io/ipfs/${this.state.ipfsHash}`);
      fetch(request).then((results) => {
        // results returns XML. lets cast this to a string, then create
        // a new DOM object out of it!
        var values=[];
        var value=[];
        results
          .text()
          .then(( str ) => {
            this.state.responseDoc = new DOMParser().parseFromString(str, 'application/xml');
            console.log(this.state.responseDoc);

            this.state.listItem  = this.state.responseDoc.getElementsByTagName('Name');
            this.state.listItems  = this.state.responseDoc.getElementsByTagName('Author');
            //console.log(this.state.listItem);
            for (this.i=0; this.i<this.state.listItem.length; this.i++){
              values.push(this.state.responseDoc.getElementsByTagName('Name')[this.i].textContent);
            console.log(values);
            }
            for (this.j=0; this.j<this.state.listItems.length; this.j++){
              value.push(this.state.responseDoc.getElementsByTagName('Author')[this.j].textContent);
            //console.log(value);
            // return responseDoc.getElementsByTagName('Name')[i].textContent;
             }

             this.setState({liItem: values});
             this.setState({liItems: value});
          })
        });
  } //onClick})})

    onSubmit = async (event) => {
      event.preventDefault();

      //bring in user's metamask account address
      const accounts = await web3.eth.getAccounts();
     
      console.log('Sending from Metamask account: ' + accounts[0]);

      //obtain contract address from storehash.js
      const ethAddress= await storehash.options.address;
      this.setState({ethAddress});

      //save document to IPFS,return its hash#, and set hash# to state
      //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 
      await ipfs.add(this.state.buffer, (err, ipfsHash) => {
        console.log(err,ipfsHash);
        //setState by setting ipfsHash to ipfsHash[0].hash 
        this.setState({ ipfsHash:ipfsHash[0].hash });
        // const retrieve = ipfs.get(`https://ipfs.io/ipfs/${this.state.ipfsHash}`);
        // console.log(retrieve);
        // const fileBuffer = this.onSubmit.files.cat(ipfsHash[0].hash);
        // console.log('Added file contents:', fileBuffer.toString())

        // call Ethereum contract method "sendHash" and .send IPFS hash to etheruem contract 
        //return the transaction hash from the ethereum contract
        //see, this https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send
        
        storehash.methods.sendHash(this.state.ipfsHash).send({
          from: accounts[0] 
        }, (error, transactionHash) => {
          console.log(transactionHash);
          this.setState({transactionHash});
        }); //storehash 
      }) //await ipfs.add
    }; //onSubmit 


    render() {
      
      return (
        <div className="App">
          <header className="App-header">
            <h1> Ethereum and InterPlanetary File System(IPFS) with Create React App</h1>
          </header>
          
          <hr />

        <Grid>
          <h3> Choose file to send to IPFS </h3>
          <Form onSubmit={this.onSubmit}>
            <input 
              type = "file"
              onChange = {this.captureFile}
            />
             <Button 
             bsStyle="primary" 
             type="submit"> 
             Send it 
             </Button>
          </Form>
          <br />

          <div>
            <table>
              <tr>
            <td><b>Name of the Book: </b></td>
            <td>{this.state.liItem.map(x => {return x + '\n';})}</td>
            </tr>
            <tr>
            <td><b>Author Name: </b></td>
            <td>{this.state.liItems.map(y => {return y + '\n';})}</td>
            {/* this one */}</tr>
            </table>
            </div>

            <img src= {`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt="" style={{height:200}}></img>
          
          <hr/>
            <Button onClick = {this.onClick}> Get Transaction Receipt </Button>
          
              <Table bordered responsive>
                <thead>
                  <tr>
                    <th>Tx Receipt Category</th>
                    <th>Values</th>
                  </tr>
                </thead>
               
                <tbody>
                  <tr>
                    <td>IPFS Hash # stored on Eth Contract</td>
                    <td>{this.state.ipfsHash}</td>
                  </tr>
                  <tr>
                    <td>Ethereum Contract Address</td>
                    <td>{this.state.ethAddress}</td>
                  </tr>

                  <tr>
                    <td>Tx Hash # </td>
                    <td>{this.state.transactionHash}</td>
                  </tr>

                  <tr>
                    <td>Block Number # </td>
                    <td>{this.state.blockNumber}</td>
                  </tr>

                  <tr>
                    <td>Gas Used</td>
                    <td>{this.state.gasUsed}</td>
                  </tr>               
                </tbody>
            </Table>  
        </Grid>
     </div>
      );
    //render
}
}

export default App;