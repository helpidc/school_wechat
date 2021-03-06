App({
  onLaunch: function () {

    //修改为后台分发给你的alliance_key
    this.globalData.appKey = 'uNy6iug7SmrN3uCY';

    //换成后台分发给你的域名
    var domain = 'https://lianyan.kucaroom.com'

    this.globalData.apiUrl = domain+'/api/wechat';
    //this.globalData.apiUrl = 'http://localhost:8000/api/wechat';
  
    //七牛图片外链域名
    this.globalData.imageUrl = 'http://image.kucaroom.com/';

    this.globalData.bgIimage = this.globalData.imageUrl+'30269a739a66831daa31ec93d28318af.jpg';
    this.globalData.show_auth = false;

    let token = wx.getStorageSync('token');
    if (!token) {
      let _this = this;
      this.login();
    } else {
      console.log('token=' + token);
    }

  },
  /**
     * 登录获取token
     */
  login: function (_method = null, _url = null, _data = null, callback = null) {
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log(res);
        this.getUserInfo(res.code, _method, _url, _data, callback);
      }
    })
  },

  /**
   * 获取用户信息 
   */
  getUserInfo: function (code, _method = null, _url = null, _data = null, callback = null) {
    console.log('get user info');
    let that = this;
    wx.getSetting({
      success: res => {
        console.log(res);
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框

          this.globalData.show_auth = false;

          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              console.log("用户信息：" + JSON.stringify(res.userInfo));

              wx.request({
                url: this.globalData.apiUrl + '/auth/login?type=weChat',
                header: {
                  'content-type': 'application/json'
                },
                method: 'POST',
                data: {
                  user_info: res.userInfo,
                  code: code,
                  app_id: this.globalData.appKey
                },
                success: function (res) {
                  wx.setStorageSync('token', res.data.data);
                  console.log('token:' + res.data.data);
                  if (_method) {
                    that.http(_method, _url, _data, callback);
                  }else{
                    if(callback){
                      callback();
                    }
                  }
                }
              })

            }
          })
        } else {
          this.globalData.show_auth = true;
          console.log('未授权');
        }
      }
    })
  },

  /** 
  * 封装微信http请求
  */
  http: function (_method, _url, _data, callback) {

    console.log('method：' + _method);

    let token = wx.getStorageSync('token');
    let _this = this;

    wx.request({
      url: this.globalData.apiUrl + _url,
      header: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      method: _method,
      data: _data,
      success: function (res) {

        if (res.data.error_code == '4001' || res.data.error_code == '4000') {
          console.log('token过期了');
          _this.login(_method, _url, _data, callback);
        } else {
          callback(res);
        }

      },
      fail: function (res) {
        console.log(res);
        console.log('出错了');
      }
    })

  },

  /** 
   * 获取七牛上传token
   */
  setUploadToken: function (call) {

    this.http('GET', '/upload_token', {}, function (res) {

      if(res.data.data){
        var token = res.data.data.uptoken;

        call(token);

        console.log('设置七牛upload token' + token);

        wx.setStorageSync('uploadToken', token);
      }

    });

  },

  /** 
   * 获取七牛上传token
   */
  getUploadToken: function (callback) {

    this.setUploadToken(callback);

  },

  /**
   * 获取新的消息盒子
   */
  getNewInbox:function(type,callback){

    this.http('GET', `/new/${type}/inbox`, {}, function (res) {

      console.log(res);

      callback(res);

    });

  },

  globalData: {
    show_auth:false,
    appId:null,
    userInfo: null,
    apiUrl: null,
    color: '0aecc3',
    imageUrl:'',
    bgImage:'',
    changeSchoolPost:false,
    changeSchoolSale: false,
    changeSchoolMatch: false
  }
})