import { readFile,writeFile } from "fs/promises";
// import http from "http";    // if import object
import { createServer } from "http";
import path from "path";
import crypto from 'crypto'; 
import fs from 'fs';
 

const jsonFilepath=path.join("data","links.json"); 
// const server=http.createServer( async (req,resp)=>{});   // if obj we can write also
const serverFile = async (resp, page, contentType) => {
    try {
        const filePath = path.join("public/", page); 
        const data = await readFile(filePath);
        resp.writeHead(200, { 'Content-Type': contentType });
        resp.end(data);
    } catch (error) {
        resp.writeHead(404, { 'Content-Type': 'text/html' });
        resp.end("404 page not found");
    }
}

const loadLinks= async ()=>{
    try {
    const data= await readFile(jsonFilepath,'utf-8');
    return JSON.parse(data);  
    } catch (error) {
        if(error.code==="ENOENT"){
            await writeFile(jsonFilepath,JSON.stringify({}));
            return {}; 
        }
        throw error;  
    }
}

const saveLinks = async (links)=>{
    await writeFile(jsonFilepath,JSON.stringify(links));
}

const server = createServer(async (req, resp) => {
    if (req.method === "GET") {
        if (req.url === "/") {
            await serverFile(resp, "/index.html", "text/html");
        } 
        if (req.url === "/style.css") {
            await serverFile(resp, "/style.css", "text/css");
        }
        if(req.url ==="/links"){ 
            const links = await loadLinks();
            resp.writeHead(200,{"Content-Type":"application/json"});
            return resp.end(JSON.stringify(links));
        }
    }  

    if(req.method==="POST" && req.url==="/shorten"){
        let body = "";

        req.on("data",(chunk)=>{
         body = body + chunk;
        });
 
        req.on("end",async ()=>{ 
            const {url,shortCode} = JSON.parse(body);  
            const links=await loadLinks();  
            // set error
            if(!url){
                resp.writeHead(400,{"Content-Type":"text/plain"});
                resp.end("Url is Required");
            } 
            if(!shortCode){ 
                resp.writeHead(400,{"Content-Type":"text/plain"});
                resp.end("Short Code is Required"); 
            }

            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex"); 

            if(links[finalShortCode]){ 
                resp.writeHead(400,{'Content-Type':'text/plain'});
                return resp.end("Short code already exists. Please choose another");
            }
            
            links[finalShortCode]=url;

            await saveLinks(links);

            resp.writeHead(200,{"Content-Type":"application/json"});
            resp.end(JSON.stringify({success:true,shortCode:finalShortCode})); 
        });

        req.on("error",(err)=>{
        console.log(`something went wronge: ${err}`);
        }); 
    }

});
const PORT = 3000;


server.listen(PORT, () => {
    console.log(`Server is running at: http://localhost:${PORT}`);
})
