import axios from "axios";
// 添加请求拦截
axios.interceptors.request.use(
  config => {
    // 附加令牌信息
    // try {
    //   let info = util.cookies.get(settings.constants.TOKEN, true);
    //   if (info && info.access_token) {
    //     config.headers.Authorization = "Bearer " + info.access_token;
    //   }
    // } catch (error) {
    //   util.log.danger("accessToken 附加失败", error.message);
    // }
    //设置网络请求15秒超时
    config.timeout = 1500;
    // if (config.url && isProduction) {
    //   if (!server) {
    //     throw new Error("server is undefined");
    //   }
    //   config.url = config.url.replace("/api", server + "/api");
    // }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);
// 添加响应拦截
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 1.请求已完成 得到服务器响应 但是http状态码不是2xx范围内
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 其他代码
          return Promise.reject(error.response);
        default:
          break;
      }
    } else if (error.request) {
      // 2.发起请求时出错未收到任何响应
      return Promise.reject({
        ErrCode: error.code,
        ErrMsg: error.message,
        error: error
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      // 3.一些错误是在设置请求时触发的
      console.log("Error", error.message, error.code);
      return Promise.reject({
        ErrCode: error.code,
        ErrMsg: error.message,
        error: error
      });
    }
  }
);

export default axios;
