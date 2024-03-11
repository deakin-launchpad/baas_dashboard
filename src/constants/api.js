class API {
  constructor() {
    this.tinyMCE = {
      key: "tcyb12muo7i8jjij0tp4se50sg1on1g7xnu884d7wat3ldz5"
    };
    this.twilio = {
      "twilioAccountSID": "",
      "twilioAPIkey": "",
      "twilioAPIsecret": ""
    };
    this.jwt = {
      url: 'https://rapid.test.aaf.edu.au/jwt/authnrequest/research/HuP9vbv2Sv3RivbqPCIzFg?entityID=https://signon-dev.deakin.edu.au/idp/shibboleth'
    };
  }
}

const instance = new API();
export default instance;