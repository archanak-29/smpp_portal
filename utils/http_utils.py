import requests

class HttpUtils:
    @staticmethod
    def post(url,payload,headers):
        res = requests.post(url, headers=headers, data=payload)
        return res.json()
    
    def get(url,payload,headers):
        res = requests.post(url, headers=headers, json=payload)
        return res.json()