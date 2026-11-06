import { ContractEntity } from "../models/contract.entity";
import { FetcherService } from "./fetch.service";

class ContractService {
  async createContract(contract: Partial<ContractEntity>): Promise<Partial<ContractEntity>> {
    const response = await FetcherService.post("/contract", contract);
    return response as Partial<ContractEntity>;
  }

  async update(contract: Partial<ContractEntity>): Promise<Partial<ContractEntity>> {
    const response = await FetcherService.patch("/contract", contract);
    return response as Partial<ContractEntity>;
  }

  async list(): Promise<ContractEntity[]> {
    const response = await FetcherService.get("/contract");
    return response as ContractEntity[];
  }

  // * TODO update aray for [[id, token], [id, token], ...]
  async listFromIDSToken(idsTokens: [number, string][]): Promise<ContractEntity[]> {
    const response = await FetcherService.post("/contract/list-ids", { ids: JSON.stringify(idsTokens) });
    return response as ContractEntity[];
  }

  async search(query: string): Promise<ContractEntity[]> {
    const encodedQuery = encodeURIComponent(query);
    const response = await FetcherService.get("/contract/search?q=" + encodedQuery);
    return response as ContractEntity[];
  }

  async delete(id: string | number): Promise<void> {
    await FetcherService.delete("/contract/" + id);
  }

  async getContractByToken(token: string): Promise<ContractEntity> {
    // Token encodé : un token contenant `?`/`#`/`&` casserait le query param (audit 🟠)
    const encodedToken = encodeURIComponent(token);
    const response = await FetcherService.get("/contract/get-by-token?token=" + encodedToken);
    return response as ContractEntity;
  }

}
export const contractService = new ContractService();
