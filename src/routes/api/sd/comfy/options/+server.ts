import { resp } from "$lib/utilities/apiHelper";
import { DebugLogger } from "$lib/utilities/error-manager";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	let body = await request.json();
	const baseUrl = body.url;
	const action = body.action || "defaultAction"; // Replace 'defaultAction' with your default action if needed
	const url = new URL(baseUrl);
	let method = "GET";
	let postProcess: (data: any) => any = (data) => data;
	switch (action) {
		case "ping":
			url.pathname = "/system_stats";
			method = "GET";
			DebugLogger.debug(url);
			break;

		case "get-model": //singular - get currently loaded model
			url.pathname = "/sdapi/v1/options";
			postProcess = async (data) => {
				return data.sd_model_checkpoint;
			};
			break;
		case "set-model":
			url.pathname = "/sdapi/v1/progress";
			//TODO: Implement this
			break;
		case "get-models": //plural - get all models
			url.pathname = "/object_info";
			postProcess = async (data) => {
				const ckpts = data.CheckpointLoaderSimple.input.required.ckpt_name[0].map((it: any) => ({ value: it, text: it })) || [];
				const unets = data.UNETLoader.input.required.unet_name[0].map((it: any) => ({ value: it, text: `UNet: ${it}` })) || [];
				const ggufs =
					data.UnetLoaderGGUF?.input.required.unet_name[0].map((it: any) => ({ value: it, text: `GGUF: ${it}` })) || [];
				let models = [...ckpts, ...unets, ...ggufs];
				for (const it of models) {
					it.text = it.text.replace(/\.[^.]*$/, "").replace(/_/g, " ");
				}
				//for now, filter out any models that contain the word 'video' or .pth extension
				models = models.map((x: { value: any }) => x.value);
				return models.filter(
					(x: string) => !x.includes("video") && !x.includes(".pth") && !x.toLowerCase().includes(".gguf") //Todo check and remove this later
				);
			};
			break;
		case "get-samplers":
			url.pathname = "/object_info";
			postProcess = async (data) => {
				//samplers can be located in the KSamper node data.KSampler.input.required.sampler_name[0]
				return data.KSampler.input.required.sampler_name[0] || [];
			};
			break;
		case "get-upscalers":
			url.pathname = "/sdapi/v1/upscalers";
			postProcess = async (data) => {
				return data.map((x: { name: any }) => x.name);
			};
			break;
		case "get-schedulers":
			url.pathname = "/object_info";
			postProcess = async (data) => {
				return data.KSampler.input.required.scheduler[0] || [];
			};
			break;
		case "get-vaes":
			url.pathname = "/sdapi/v1/sd-vae";
			postProcess = async (data) => {
				return data.map((x: { name: any }) => x.name);
			};
			break;
		case "scripts":
			url.pathname = "/sdapi/v1/scripts";
			break;
		case "get-loras": //working
			url.pathname = "/sdapi/v1/loras";
			break;
		case "get-ct-models": //working
			url.pathname = "/controlnet/model_list";
			break;
		case "get-ct-modules": //working
			url.pathname = "/controlnet/module_list";
			break;
		case "get-ct-types": //Working - better than get modules and get models
			url.pathname = "/controlnet/control_types";
			break;
		case "interrupt": //working - returns nothing.
			url.pathname = "/sdapi/v1/interrupt";
			method = "POST";
			break;
		case "interrogate": //untested.
			url.pathname = "/sdapi/v1/interrogate";
			method = "POST";
			break;
		case "generate":
			url.pathname = "/prompt";
			method = "POST";
			postProcess = async (data) => {
				/* const promptId = data.prompt_id;
        let item:any;
        const historyUrl = new URL(url);
        historyUrl.pathname = '/history';

        function delay(ms: number) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }

        while (true) {
          const res = await fetch(historyUrl.toString());
          if (!res.ok) {
            throw new Error('ComfyUI returned an error.');
          }
          const history = await res.json();
          item = history[promptId];
          if (item) {
            break;
          }
          await delay(100);
        }

        if (item.status.status_str === 'error') {
          const errorMessages = item.status?.messages
            ?.filter((it: any) => it[0] === 'execution_error')
            .map((it: any) => `${it.node_type} [${it.node_id}] ${it.exception_type}: ${it.exception_message}`)
            .join('\n') || '';
          throw new Error(`ComfyUI generation did not succeed.\n\n${errorMessages}`.trim());
        }

        const imgInfo = Object.keys(item.outputs).flatMap(key => item.outputs[key].images)[0];
        const viewUrl = new URL(url);
        viewUrl.pathname = '/view';
        viewUrl.search = `?filename=${encodeURIComponent(imgInfo.filename)}&subfolder=${encodeURIComponent(imgInfo.subfolder)}&type=${encodeURIComponent(imgInfo.type)}`;

        const imgResponse = await fetch(viewUrl.toString());
        if (!imgResponse.ok) {
          throw new Error('ComfyUI returned an error.');
        }
        const imgBuffer = await imgResponse.arrayBuffer();
        return Buffer.from(imgBuffer).toString('base64');*/
			};
			break;
		default:
			throw new Error("Unknown action");
	}
	try {
		//it's a request, init bruv.
		const fetchOptions: RequestInit = {
			method: method,
			headers: {
				"Content-Type": "application/json"
			},
			credentials: "include",
			body: body?.body?.prompt ? JSON.stringify(body.body) : undefined
		};
		DebugLogger.debug("FETCHING", url.toString(), fetchOptions);

		const result = await fetch(url.toString(), fetchOptions);
		DebugLogger.debug("RESULT", result);
		if (result.status === 200) {
			let rsp = await result.json();
			const data = await postProcess(rsp);
			//console.log("RETURNING OK",data);
			return resp(data, 200);
		}
		throw new Error("Failed to fetch data");
	} catch (error) {
		console.error(error);
		return resp(error, 500);
	}
};
