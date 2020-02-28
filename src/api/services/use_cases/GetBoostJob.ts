

import { Service } from 'typedi';
import { UseCase } from './UseCase';
import { ClientError } from '../errors/ClientError';
import { BoostJobRepository } from '../../repositories/BoostJobRepository';
import { OrmRepository } from 'typeorm-typedi-extensions';
import * as matter from 'mattercloudjs';
import { SubmitBoostJob } from './SubmitBoostJob';

@Service()
export class GetBoostJob implements UseCase {

    constructor(
        @OrmRepository() private boostJobRepo: BoostJobRepository,
        @Service() private submitBoostJob: SubmitBoostJob
    ) {
    }

    public isEmpty(v: any): boolean {
        if (v === undefined || v === null || v === '' || v === 0) {
            return true;
        }
        return false;
    }
    public async run(params: {txid: string, vout?: number}): Promise<any> {
        if (
            this.isEmpty(params.txid)
        ) {
            throw new ClientError(422, 'required fields: txid');
        }
        const boostJobEntity = await this.boostJobRepo.findOne({
            txid: params.txid,
            vout: params.vout ? params.vout : 0,
        });
        let rawtx;
        if (!boostJobEntity) {
            // Then try to look it up on the blockchain
            try {
                rawtx = await matter.instance().getTxRaw(params.txid);
            } catch (err) {
                console.log('getBoostJob error', err);
                throw err;
            }
        } else {
            rawtx = boostJobEntity.rawtx;
        }
        return this.submitBoostJob.run({rawtx: rawtx});
    }
}
