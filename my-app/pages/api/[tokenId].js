//动态路由
export default function handler(req, res){
    //从查询参数获取tokenId
    const tokenId = req.query.tokenId;
    //当所有的图像都上传到github上时，我们可以直接从github提取图像 ，进入图像里找到raw,进去复制下面URL
    const image_url="https://raw.githubusercontent.com/Div-Denis/NFT-Collection/master/my-app/public/cryptodevs/";
    //API正在发回Crypto Dev的元数据 为了使我们的馆藏与Opensea兼容
    //我么在从api发回响应时我们需要遵循一些元数据标准
    //更多信息可以在这里找到：https://docs.opensea.io/docs/metadata-standards
    res.status(200).json({
        name:"Crypto Dev #"+ tokenId,
        description: "Crypto Dev is a collection of developers in crypto",
        image: image_url + tokenId + ".svg",
    })
    //http://localhost:3000/api/1在网站这里看到信息
}