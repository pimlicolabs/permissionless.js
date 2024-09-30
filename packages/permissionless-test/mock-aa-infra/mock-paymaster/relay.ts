import util from "node:util"
import type { FastifyReply, FastifyRequest } from "fastify"
import {
    type Address,
    type RpcRequestError,
    BaseError,
    getAddress,
    toHex
} from "viem"
import {
    type BundlerClient,
    type UserOperation,
    entryPoint06Address,
    entryPoint07Address
} from "viem/account-abstraction"
import { fromZodError } from "zod-validation-error"
import {
    InternalBundlerError,
    type JsonRpcSchema,
    RpcError,
    ValidationErrors,
    jsonRpcSchema,
    pimlicoGetTokenQuotesSchema,
    pmGetPaymasterData,
    pmGetPaymasterStubDataParamsSchema,
    pmSponsorUserOperationParamsSchema
} from "./helpers/schema"
import {
    isTokenSupported,
    maxBigInt,
    type PaymasterMode
} from "./helpers/utils"
import {
    type SingletonPaymasterV07,
    type SingletonPaymasterV06,
    getDummyPaymasterData
} from "./singletonPaymasters"

const handleMethodV06 = async (
    userOperation: UserOperation<"0.6">,
    paymasterMode: PaymasterMode,
    bundler: BundlerClient,
    singletonPaymasterV06: SingletonPaymasterV06,
    estimateGas: boolean
) => {
    let op = {
        ...userOperation,
        ...getDummyPaymasterData(
            true,
            singletonPaymasterV06.singletonPaymaster.address,
            {
                mode: "verifying"
            }
        )
    }

    const callGasLimit = userOperation.callGasLimit
    const verificationGasLimit = userOperation.verificationGasLimit
    const preVerificationGas = userOperation.preVerificationGas

    if (estimateGas) {
        try {
            const gasEstimates = await bundler.estimateUserOperationGas({
                ...op
            })
            op = {
                ...op,
                ...gasEstimates
            }

            op.callGasLimit = maxBigInt(op.callGasLimit, callGasLimit)
            op.preVerificationGas = maxBigInt(
                op.preVerificationGas,
                preVerificationGas
            )
            op.verificationGasLimit = maxBigInt(
                op.verificationGasLimit,
                verificationGasLimit
            )
        } catch (e: unknown) {
            if (!(e instanceof BaseError)) throw new InternalBundlerError()
            const err = e.walk() as RpcRequestError
            throw err
        }
    } else if (
        userOperation.preVerificationGas === 1n ||
        userOperation.verificationGasLimit === 1n ||
        userOperation.callGasLimit === 1n
    ) {
        throw new RpcError(
            "Gas Limit values (preVerificationGas, verificationGasLimit, callGasLimit) must be set",
            ValidationErrors.InvalidFields
        )
    }

    const result = {
        preVerificationGas: toHex(op.preVerificationGas),
        callGasLimit: toHex(op.callGasLimit),
        verificationGasLimit: toHex(op.verificationGasLimit || 0),
        ...(await singletonPaymasterV06.encodePaymasterData(op, paymasterMode))
    }

    return result
}

const handleMethodV07 = async (
    userOperation: UserOperation<"0.7">,
    paymasterMode: PaymasterMode,
    bundler: BundlerClient,
    singletonPaymasterV07: SingletonPaymasterV07,
    estimateGas: boolean
) => {
    let op = {
        ...userOperation,
        ...singletonPaymasterV07.getDummyPaymasterData({
            mode: "verifying"
        })
    }

    const callGasLimit = userOperation.callGasLimit
    const verificationGasLimit = userOperation.verificationGasLimit
    const preVerificationGas = userOperation.preVerificationGas

    if (estimateGas) {
        try {
            const gasEstimates = await bundler.estimateUserOperationGas({
                ...op
            })

            op = {
                ...op,
                ...gasEstimates
            }

            op.callGasLimit = maxBigInt(op.callGasLimit, callGasLimit)
            op.preVerificationGas = maxBigInt(
                op.preVerificationGas,
                preVerificationGas
            )
            op.verificationGasLimit = maxBigInt(
                op.verificationGasLimit,
                verificationGasLimit
            )
        } catch (e: unknown) {
            if (!(e instanceof BaseError)) throw new InternalBundlerError()
            const err = e.walk() as RpcRequestError
            throw err
        }
    } else if (
        userOperation.preVerificationGas === 1n ||
        userOperation.verificationGasLimit === 1n ||
        userOperation.callGasLimit === 1n
    ) {
        throw new RpcError(
            "Gas Limit values (preVerificationGas, verificationGasLimit, callGasLimit) must be set",
            ValidationErrors.InvalidFields
        )
    }

    const result = {
        preVerificationGas: toHex(op.preVerificationGas),
        callGasLimit: toHex(op.callGasLimit),
        paymasterVerificationGasLimit: toHex(
            op.paymasterVerificationGasLimit || 0
        ),
        paymasterPostOpGasLimit: toHex(op.paymasterPostOpGasLimit || 0),
        verificationGasLimit: toHex(op.verificationGasLimit || 0),
        ...(await singletonPaymasterV07.encodePaymasterData(op, paymasterMode))
    }

    return result
}

const handleMethod = async (
    bundler: BundlerClient,
    singletonPaymasterV07: SingletonPaymasterV07,
    singletonPaymasterV06: SingletonPaymasterV06,
    parsedBody: JsonRpcSchema
) => {
    if (parsedBody.method === "pm_sponsorUserOperation") {
        const params = pmSponsorUserOperationParamsSchema.safeParse(
            parsedBody.params
        )

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [userOperation, entryPoint] = params.data

        if (entryPoint === entryPoint07Address) {
            return await handleMethodV07(
                userOperation,
                { mode: "verifying" },
                bundler,
                singletonPaymasterV07,
                true
            )
        }

        if (entryPoint === entryPoint06Address) {
            return await handleMethodV06(
                userOperation,
                { mode: "verifying" },
                bundler,
                singletonPaymasterV06,
                true
            )
        }

        throw new RpcError(
            "EntryPoint not supported",
            ValidationErrors.InvalidFields
        )
    }

    if (parsedBody.method === "pm_getPaymasterStubData") {
        const params = pmGetPaymasterStubDataParamsSchema.safeParse(
            parsedBody.params
        )

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [, entryPoint, , data] = params.data

        if (data !== null && "token" in data) {
            isTokenSupported(data.token)
        }

        const sponsorData = {
            name: "Pimlico",
            icon: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEAkACQAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCADEAMQDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+IOv6OP1MKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKACgAoAKAHL3pMljsD0FIV2GB6CgLsMD0FAXYYHoKAuwwPQUBdhgegoC7DA9BQF2GB6CgLsa3amhobTKCgAoAKACgAoAKACgAoAKACgAoAKACgAoAcvekyZdB9Ik7fw18M/iR4zsZtU8H/D7xv4r023u3sJ9R8NeFNe12xgvooLe5kspbvS7C6t47uO3u7W4e3eQTJDc28rIEmjZsp1qNN2qVaUHa9p1IRdtr2k07XTXyJlOEHaU4xe9pSSdu+rR0P/ChPjn/ANEX+LH/AIbnxh/8pqj63hf+gmh/4Op//JC9rS/5+0//AAOP+Yv/AAoT46f9EX+LH/hufGH/AMpqPreF/wCgmh/4Op//ACQe1pf8/af/AIGv8w/4UJ8dP+iL/Fj/AMNz4w/+U1H1vC/9BND/AMHU/wD5IPa0v+ftP/wNf5h/woT46f8ARF/ix/4bnxh/8pqPreF/6CaH/g6n/wDJB7Wl/wA/af8A4Gv8w/4UJ8dP+iL/ABY/8Nz4w/8AlNR9bwv/AEE0P/B1P/5IPa0v+ftP/wADX+Yf8KE+On/RF/ix/wCG58Yf/Kaj63hf+gmh/wCDqf8A8kHtaX/P2n/4Gv8AMafgH8dTjHwW+LJ/7pz4w/8AlNVRxOGe2IoP/uNT/wDkhqtR1/e0/wDwOP8AmO/4Z/8Ajp/0Rf4s/wDhufGH/wApqv6xh/8An/R/8G0//kifrNH/AJ+0/wDwOP8A8kH/AAz/APHT/oi/xZ/8N14w/wDlNR9Yw/8Az/o/+Daf/wAkH1mj/wA/af8A4HH/AOSD/hn/AOOn/RF/iz/4brxh/wDKal9Yw/8Az/o/+Daf/wAkH1ml/wA/Kf8A4HH/AOSOc8S/C74k+DbNNR8XfD7xx4V0+SUQR3/iTwnr2h2ckxGRCl1qdhawPKeojVy+O1XGrSm7Qq05vtCcZP7otsuFanN2jOEn2jJN/cmzhtp9q0sXzLzDafaiwcy8xdnvRYObyDZ7/p/9eiwc3kGz3/T/AOvRYObyDZ7/AKf/AF6LBzeQbPf9P/r0WDm8hlIoKACgAoAcvekyZdB9Ik/0pP8AgzjBP/BMv46+37dvxLA+n/DPn7MB/LJNfk/HkIxzjDWWkstpSbu9/rWMWmvkrnx/ETf12mv+oal/6VM/rKxXxVl5/e/8z5+3mvuQYosvP73/AJhbzX3IMUWXn97/AMwt5r7kGKLLz+9/5hbzX3IMUWXn97/zC3mvuQYosvP73/mFvNfcg2juAfqKa02uvm/8xrT+rBtX0H5Ua9397/zANq+g/KjXu/vf+YWXZfcG1fQflRr3f3v/ADCy7L7jj/H/AMPfAnxU8G+Ifh58S/B3hnx94F8V6dPpPiXwf4v0XT/EPhzXdNuBiWy1TR9Ut7mxvIGIV1WeF/LlRJYyksaOulKrVoVI1aNSdOpB3hOE5RlFrqmndf0ioTlTkp05OEou6lF2afk0f463/BWr9l3wT+xh/wAFG/2sf2bPhqblPh78O/iRBP4IsbueS7n0Xwp468K+HfiPoPhxryYme9Xw1pfi+18PxXlyz3V1FpqT3UstzJLI37pkWMq5hleExddp1atN+0cVZOcJzpylbZOXJzNKyu3ZJWR+g5fXnicHQrVHecoe80rXcW4N/Plv89NND8669g7AoAKACgAoAKAIak0CgAoAKAHL3pMmXQfSJP6pv+CHH/BwJ8Ef+CU37KHxD/Z5+JXwE+KnxS1zxn+0P4q+M9p4g8D634U0zSbPSvEPw1+EvgaHRriDXriK7fULe8+HV9fSzRKbZrbUbREJljmx8dxHw1iM7xtHE0cTQoxpYSGHcaqm5OUa1eq5LlTVrVku90zxMzyqrj8RCtCrTpqNGFO01K94uTvov7x+zH/EZz+yf/0Z3+0L/wCFX8Of/k2vA/1Cxv8A0H4T/wABrf8AyJ53+rmI/wCgmh90/wDIP+Izn9k//ozv9oX/AMKv4c//ACbR/qFjf+g/Cf8AgNb/AORD/VzEf9BND7p/5B/xGc/sn/8ARnf7Qv8A4Vfw5/8Ak2j/AFCxv/QfhP8AwGt/8iH+rmI/6CaH3T/yD/iM5/ZP/wCjO/2hf/Cr+HP/AMm0f6hY3/oPwn/gNb/5EP8AVzEf9BND7p/5B/xGc/sn/wDRnf7Qv/hV/Dn/AOTaP9Qsb/0H4T/wGt/8iH+rmI/6CaH3T/yD/iM5/ZP/AOjO/wBoX/wq/hz/APJtH+oWN/6D8J/4DW/+RD/VzEf9BND7p/5B/wARnH7KHb9jv9oT8fF3w3X8gb3JqJcCY6P/ADG4V+kav6oT4dxC/wCYik/SM/8AIT/iM5/ZR/6M5/aF/wDCu+G3/wAnUf6i43/oMof+C6ov9Xa//P8Apf8AgMg/4jOf2Uf+jOf2hf8Awrvht/8AJ1H+ouN/6DKH/gqqH+rtf/n/AEv/AAGR+nf/AASn/wCC/fwU/wCCrfx58cfAX4bfAX4o/CzWfA3wk1X4uXeu+ONd8J6npl9pmk+MfBXg6XSbaDQLia6S+luvG1peJNKBbrb2VwjHzJIgfHzjh3EZPQp161elVjUrKilCM4yTdOdTmfMrWtBrvdo48blVXBU1VnVhNOSjaKknqm7u+nQ/fevnjyj/ACR/+DjYAf8ABaP9uHHfxN8JCfr/AMM8fCGv2rhV2yLA6/Yq/wDqRWPvMn/5F+H/AMM//Tkz8SK+kT7s9MWmAUwCgAoAKAIak0CgAoAKAHKQM0mS0O3D1pWYrM6zwN4D8cfE7xVo3gX4beDfFXxA8a+Irn7FoHhDwV4e1fxT4n1u72NKbbSdB0OzvtU1CdYkkleO0tZXSKOSVgERmGdWpToQlVrVIUqcfinUlGEFfRXlJqK+bRM5Rpxc5yjCK3lKUYxXrKTSXzZ95R/8Eff+CqEsaSp/wT2/a8KSIrrv+BPxAibawBG6OXRUkjYA/MjorKcggGvNee5Mrp5ngrrp7aL19Y3T+TON5ll6dnjMPfyqxf4q6+5jv+HPf/BVL/pHt+11/wCGN8ef/Keo/t/KOuY4O3lWiV/aGAf/ADG4b/wdD8r3D/hz3/wVS/6R7ftdf+GN8ef/ACno/wBYck/6GWE/8HwD6/gf+gzDf+DY/wCYf8Oe/wDgql/0j2/a6/8ADG+PP/lPR/rDkn/Qywn/AIPgH1/A/wDQZhv/AAbH/MP+HPf/AAVS/wCke37XX/hjfHn/AMp6P9Yck/6GWE/8HwD6/gf+gzDf+DY/5h/w57/4Kpf9I9v2uv8Awxvjz/5T0f6w5J/0MsJ/4PgH1/A/9BmG/wDBsf8AMX/hz1/wVR7/APBPf9rkfX4G+PP/AJT0f29k0vhzLB6d8RTX5tB/aOAW+MofKfN+V7B/w56/4Kof9I+f2uP/AAxvj3/5TVazzJ7X/tLBf+FNL9ZC/tLLv+gyj97/AMj49+N3wA+N37NfjY/Db9oD4U+Pfg34/XSbDXm8G/EbwzqnhPxGNF1UzrpuqHStXt7W7+w3xtbkWtyIzFMYJQjEowHbhsXhsbT9thK9LEUlKUHUpSU4c8fijzLS66nTTq0q0eelUjUg9pRd0f0//wDBm/8A8pGv2gv+zK/GZ/L45fAOvkOPP+RXhP8AsYQX/ltif8jxeIP90g/+nyX/AJJI/wBJKvys+NP8kf8A4ON/+U0f7cH/AGMvwj/9Z4+EVftHC/8AyIsB/gq/+pFY+9yf/kXYbzjP/wBO1F+h+JFfSHpC1a2QBTAKACgAoAhqTQKACgAoAKACgD/Qv/4M2v2cfhjD+zH+0j+1hceHNMvfjBq/x/1T4C2Pie8s4LjVPD3gLwd8Nvhf47n0vRLyRWl02DxJrfxHefXUtTGdQXQNEW5aRLKFV/MOPMXW+uYTBKclh/qqxMoKVoyqyrV6alJLdxjTtG+15NbnyHEVaft6VDmfs/ZKpyptJyc5xu+9lGy7Xfc/tD2+7fma/P7I+b+YbR6n8zRyoPn+X+QbR7/nRZef3k8q8/vDaPf86LLz+8OVef3htHv+dFl5/eHKvP7w2j3/ADosvP7w5V5/eKBimlYaVhaBn+X7/wAHaf8Aylmuv+zbvg3/AOlnjSv1vge39iK3/QXXv62p/pY+1yD/AHF/9f6n/tp7j/wZvf8AKRv9oL/syrxn/wCry+AVYcef8ivB/wDYxp/+o2KI4g/3OH/X+P8A6RM/0ka/Kz40/wAkb/g42/5TR/tw/wDYzfCT/wBZ4+ENftHC/wDyIsv/AMFX/wBSax97k/8AyLsL/hqf+n6p+JNfSHpC1a2QBTAKACgAoAhqTQKACgAoAKACgD/Sq/4M5P8AlGX8df8As+z4l/8ArP37MNfk/Hf/ACNsN/2LqX/qVjD4riL/AH2l/wBgy/8ATtU/q91K7Nhp1/fLGJTZ2dzdCItsEht4Xl2b9rbN+zbu2ttznacYPxcVzSiu7S+88JK7S7tL72kfwNzf8HpPxRilljH7APgIiOR0BP7QfiAEhGK5IHwnwCcZx26V+kf6gU3qszqRXZ4WEmvV/WF+R9T/AKtJaPFyb6tU4pfL3mR/8RpnxR/6MA8Bf+JB+IP/AJ09L/iH8P8AoaT/APCOP/zSH+ra/wCgqX/guP8A8kH/ABGmfFH/AKMA8Bf+JB+IP/nT0f8AEP4f9DSf/hHH/wCaQ/1bX/QVL/wXH/5IP+I0z4o/9GAeAv8AxIPxB/8AOno/4h/D/oaT/wDCOP8A80h/q2v+gqX/AILj/wDJB/xGmfFH/owDwF/4kH4g/wDnT0f8Q/h/0NJ/+Ecf/mkP9W1/0FS/8Fx/+SD/AIjTfih3/YB8Bj6ftB+IP/nTVMuAoRt/wpTf/crFf+52H+rcOuLqL0owl+c0L/xGm/E7/owHwH/4kH4g/wDnTVP+ocf+hjP/AMJo/wDy4P8AVun/ANBtX/wRD/5afzTf8FUv+Cimt/8ABUH9qmb9p/Xvhbpfwfvpfh34Q+Hw8H6R4qu/GNosHhKTWJY9TOs3uh+Hpmlvm1eQPbf2cqQCFAsspckfXZHlSyfA/U1Wdde2qVfaSgoP31FcvKpSWnLvfXsezgcHHA0PYxqSq+/KfNKCh8SWllKXbv1P28/4M3v+UjX7QX/ZlXjP/wBXl8Aq8Djz/kV4P/sY0/8A1GxR53EH+50/+v8AH/0iZ/pI1+Vnxp/kjf8ABxt/ymj/AG4f+xm+Ef8A6zx8Ia/aOF/+RFl/+Cr/AOpNY+9yf/kXYX/DU/8AT9U/EmvpD0hatbIApgFABQAUAQ1JoFABQAUAFABQB/pV/wDBnJ/yjK+On/Z9nxM/9Z+/Zhr8n48/5G+G/wCxdR/9ScWfFcRf77R/7BY/+nqx/Vj4h/5AGuf9gjUv/SOavidtTwo/FH/FH/0pH+Fnd/8AH1c/9d5v/RjV/RkPgj6I/U3v935H0p+yx+xn+1D+2z48uvhr+yz8FvGXxl8XadYx6prNp4Zt7O30zw9pcs62sWpeJvE2t3mleGPDVlPct9ntbnXtY06K7uA0Fs0sqOg5MdmOCy2kq2NxEMPTk+WLlduTte0YxTlJ+idupzV8TQw0eatUUE3ZX1bfWyV27eh+oH/ENN/wWfPP/DIQH1+NvwAz9Dj4nkZHfHHpXj/63ZB/0G/+Ua3/AMrOP+2cu/6CEvWE/wD5EX/iGl/4LQf9Ghr/AOHt+AP/AM8+k+L8gX/MY36UK/8A8rE86y5f8v7+kJ//ACIf8Q0v/BaD/o0Nf/D2/AH/AOefT/1vyD/oNf8A4Ir/APysP7ay7/n/AP8AlOf/AMiH/ENJ/wAFnz1/ZDH4fG34Af1+J9TLizIpbYz/AMo1/wD5WJ51l3/P/wD8kn/8iJ/xDR/8Fnv+jQx/4e34Af8Azz6n/WvIv+gz/wAo1v8A5WL+2cu/5/8A/kk//kRf+IaP/gs9/wBGh/8AmbfgB/8APPqlxZkXXG/+Ua//AMrD+2cu/wCf/wD5JP8A+RP6JP8Ag2p/4JGft/fsA/tp/GH4s/tXfAv/AIVh4C8U/sweJvh5oWuf8LC+GPi77b4u1D4q/CLxJaaV9g8E+MfEOp2/m6N4Y1u8+2XNnFYr9i8h7lbie3im+X4tzvLczwOGo4LEe2qQxkas4+zqQtTVCvByvOEU/enFW31v0PJzjMMLisPCFCrzyVTma5ZxsuWSv70Ut2j+2uvgD5k/yR/+Djf/AJTR/twf9jL8I/8A1nn4RV+0cL/8iLAf4Kv/AKkVj73J/wDkX4f0n/6cmfiRX0h6QtWtkAUwCgAoAKAIak0CgAoAKACgAoA/0q/+DOT/AJRlfHT/ALPs+Jn/AKz9+zDX5Px5/wAjfDf9i6j/AOpOLPiuIv8AfaP/AGCx/wDT1Y/qx8Q/8gDXP+wRqX/pHNXxJ4Ufij/ij/6Uj/Czu/8Aj6uf+u83/oxq/oyn8EfRH6m9/u/I/wBRH/g1L+FfgjwT/wAEmfAvjzw/oVjZeLfjH8U/i54n8fa8lvENT12+8MeNtW8AeH4Lq92/aJLDR/D3hiyh0+xaQ2tpc3WqXUEUc+pXsk/4/wAaVqtXOqlOdSTp4ejRp0qd/cgpU1Uk0tlKUptyfxNcqbskl8JntWc8wlBv3adOEYLtdKUvvuv62/pTr5KyPGCjlXmAUcq8wCmlYAoAKACgAPAoA/yI/wDg4K8X+HPHP/BYz9ubXvCurWOt6TB8RfCPheS+0+5iurddd8C/CT4e+B/FenGWFnT7Ro3inw7rOj3ke7dDeWE8MgWSN1X9t4XpuOR4CM4yi/ZSmk1a8alWpUhJd1KEoyT6ppn32Uxccvwye7hKVvJ1JNP5ppo/G0CvfaZ6aSYuBVLZDsgwKYWQYFAWQYFAWQYFAWRBSGFABQAUAOXvSZLHYHoKQrs/0pf+DOMk/wDBMv46f9n2fEz/ANZ//ZiH9K/JuOZXzahfpgKa+7EYr/M+L4gk3jqflh4r/wAq1f1/U/qz8Q/8gDW/+wRqP/pHNXxqV2l30+88RfFH/HD/ANKR/hZ3nF3c/wDXxMPykav6LgnyRT0aSUl2fVH6i5aJ23S/JH+qv/wa85/4c0fs4k/9Df8AHr/1dnjj/P4V+NcY6Z/i49PZ4WXzlh6bZ8DnOuY1319xf+SR/wAj9h/2ufiv4j+A/wCyp+0x8cPB9po9/wCLfg3+z98Zvir4XsfEVveXfh+98RfDz4c+JPF2i2mu2mnX+lahdaNc6lpFtDqdtY6ppl5PZPNFa6hZzulxH4ODowxGLw2Hm2oV69GlJxaUlGpUhCTi2mk0pNptNJ7pnBQp+1rUabvy1KtOEmt1GclFtX6q5/nq/wDEYn/wU7/6I3+w9/4bD44//RH1+lrgLKGrvE5nrr/Hw3/zIfWf6vYP/n7iP/Aqf/yoT/iMT/4Kd/8ARGv2Hv8Aw2Hxx/8Aoj6P9Qsn/wCgnM//AAfhv/mQf+r2D/5+4j/wKn/8qEb/AIPFP+Cnf/RGv2H/APw2PxyH8v2kKuPAeUL/AJiMxfrXo/8AtuGiC4dwb/5e4j/wKn/8rG/8Rin/AAU8/wCiN/sP/wDhsvjn/wDRIU/9Q8o/5/5h/wCD6f8A8pH/AKu4P/n7iPvp/wDysP8AiMU/4Kef9Eb/AGH/APw2Pxz/APokKP8AUPKP+f8AmH/g+n/8oD/V3B/8/cR99L/5WH/EYr/wU8/6I1+w9/4bH45//RI0f6hZP/0EZj/4Ppf/ADOH+ruD/wCfuI++j/8AKjyT41f8HYv/AAVY+L3gTWfA+hv+zx8C5tbs7rT7nxv8Fvhx4wsPHVnaXsLW840bV/iJ8TfiRYaLeCN3Ntq+l6Ra6zp8xW607ULS7igni2ocEZNRqRqSeLxCi7+yr1oypS7c8YU6bkv7rfK1pJNG1LIcDTalL2tWzTSqSjy6d1CEb+jdu6Z/NXqeralreo3+saxf3uravqt7danquq6nd3F/qWp6lfTyXV9qGoX128t1e315cyy3F3d3MstxczySTTSPI7MfroQjTioxSUUlGMUkoxilZJJaJJaJLRJJJaHr8iW1klskv8ijv9v1qxpW6/h/wRfM9qQ9f6X/AAQ8z2oDX+l/wQ8z2oDX+l/wQ8z2oDX+l/wQ8z2oDX+l/wAEjoGFABQAUAOXvSZMug+kSf6Uv/BnH/yjK+On/Z9nxM/9Z/8A2Yf/AK9fknHP/I2w/wD2BUv/AFKxif4JHxeff77H/rxH/wBO1v8AgH9WfiD/AJAOt/8AYJ1H/wBI5q+Pjo0+zPEW8f8AFH/0pH+Fje/8fd37XM//AKNav6Hpzbpxvq+VXfXY/UUrxj6L8kf6rX/Br1/yhn/Zw/7G/wCPf/q7fHNfjvF//I/xn+DC/wDqPTPg87/5GVf0p/8Apqmfpx/wUk/5R3/t5H0/Yx/ai/8AVH+Oa8jK/wDkZYD/ALDMN/6fpnFhL/W8Kl1xNH/04j/FjJya/eo6JI/R99T+in9mf/g2J/4KLftW/AL4TftHfDPxZ+y/Z+APjL4L0jx54StfFnxL8daX4kg0XWofPs49Z07TvhRrFlZ36p/r4LbVL6JG4W4frXy+M4wyzBYqvhKtPFuph6jpzlClFwcla/K3NXS2vbdM8itnWDoVp0ZqrzQk4ytBWTXrJP8AAxv2t/8Ag2k/4KEfsY/s6fFH9p74t+K/2Z774c/CHRLPX/FVp4L+I3jfWPFE1jfa3pWgQro+map8LNCsby4F9q9q7x3GrWSi3WZ1kaREik0wHFuV4/F0MHRhi1VxE1CMp0qagnZv3mqsmlZfyvoOhnWFr1oUacK3NUdk3GCXf/n43t5H89VfUntBQAUAFABQAUAFABQAUAFABQAUAFABQAUAKDii1xNXF3H2pWFZH+lR/wAGcf8AyjK+On/Z9nxM/wDWf/2Y/wDCvyPjj/kbUP8AsCh/6lYo+Jz7/fYf9eF+FWsf1Z+IP+QDrf8A2CdR/wDSOavj1ueIt4/4o/8ApSP8LK8/4/Lv/r5n/wDRr1/QlL+HH/CvyP1KPwx/wr8kf6A3/BBj/gtl/wAExv2NP+CZXwT/AGf/ANpT9puL4a/F3wl4l+Lt94g8Iv8ACH49eLGsLTxN8UvFfiLQ5v7b8C/C7xP4buhfaNqVleBLPWLiS3E/kXaQXMcsKfnHEnD+b47N8TicJg51qFSGHUKiqUYqThRhCWk6kZaSTTut12Pks0yvHYjHVq1GhKdOShaXNBXtTgno5J6NNao+6/23P+DhX/gj78XP2Mv2t/hT8Pf2v4PEPj74mfsyfHr4feCNAHwL/aW0s634v8Z/CrxX4c8NaQNS1r4Nado+nnUtZ1KyshfarqFjptoZ/tF9eWtrHLOnnYDhnPaGNwlapgJxp0sVh6lSXtaD5acK0JTlZVW3aKbsk32Ry4bJ8xp4nDVJ4aShTrU5zfPDSMZxcnpJt2Sb0XQ/zBO9frii7X9T7VKzS8z/AGJv+CJ3/KJr9gH/ALNr+Hv/AKQPX4dxF/yOcx/7Cqn5n55mf/Ixxn/X9nnP/BwL/wAoc/26/wDsmHh7/wBWf4Eq+Gv+R5l7Wlqz/wDTVT8uhWWaY/Df4p/+m5H+QzX7mfogUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAf6VP/BnH/yjK+On/Z9nxL/9UB+zHX5Fxx/yNqH/AGBw/wDUnFHxGff75D/rwv8A09WP6s/EP/IB1v8A7BGo9Bk/8ec3Ycn8K+PW6XdpfN6I8Nbx/wAUf/Skf4gt38DfjWbq6YfB/wCKJBuJiCPAHisggyMQeNJ7iv6BpVaSpxbrUkuVaurC2i6Pm1P06NWi4Raq0mnFf8vI9vW5X/4UZ8bP+iPfFL/w3/iz/wCVNX7eh/z/AKH/AIOp/wDyRXtaX/P2n/4HH/MP+FGfGz/oj3xS/wDDf+LP/lTR7eh/z/of+Dqf/wAkHtaX/P2n/wCBx/zA/A341gZPwe+KWPX/AIV/4s/+VFCxOHWn1ih6e2pdv8QvaUv+flK/+OH+Z/rwf8EYdM1LRf8AglT+wZpWsaffaVqlh+zj4Atb/TdStJ7G/srmKxdZbe7s7qOK4tp42yskU0aSIwIZQa/EeIZRlnGYyi1KLxVS0otNPXo1dM/PMyaeYYtppp13Zp3T801o0eV/8HAv/KHP9uz/ALJh4e/9Wf4Eq+Gf+R5l/wD1+f8A6bqFZZ/yMML/AIp/+m5H+QzX7ofooUAFABQAUAFABQAUAFABQAUAFABQAUAFABQAUAf6Uv8AwZxTRN/wTP8AjvCHQyx/t0/EiR4wwLrHL8AP2ZxE7LnIR2ilVGIwxjcAnacfkfHC/wCFWh/2BR+9YrF/193c+Hz92xsE+tBf+nax/WfXxp4g3aOwA+gFLbRILJ77+i/UNopXfZfcKy8vuj/kG0UXfZfcFl5fdH/INopqUu1vkFl5fdH/ACFxQ1f/AIYLL+v+AfjX/wAHBtzbWn/BHD9umS5nit0k+G/hW1RppFjV7i9+K/w/s7SBSxAMtzdTw28KD5pJpUjUFmAr3eGYt57l1tf3s2/SNCrJ/gj0MrV8ww1t+af/AKbmf5EJUjtX7kfod/kGD6H8qAuu4YPofyoC67hg+h/KgLruGD6H8qAuu4YPofyoC67hg+h/KgLruGD6H8qAuu4YPofyoC67hg+h/KgLruGD6H8qAuu4lAwoAKACgAoAKAP22/4I1f8ABar4tf8ABJPxv41tbPwRbfGX4A/FifS734i/Cq716fw1qtp4g0a2ns9M8a+A/EX2PV7LRfEMdpOthrVrqOh6lp/ibSbWz0+4Om3dlpmsad87nuQUc5hBup7DE0rqnWUOdOL3hUhzR5o3V01JSi7tXu0/IzLLKePUXz+yrU78tTl5k4veEldNq6umndO71u0/6mYv+DzX9kAxp5v7In7SKSlV8xI9f+GMiK+PmVJG16FnUHhWaKMsMEopOB8a+A8fd2x2Da6Nxrpv5KnK33v1PE/1dxP/AD/oP5VF/wC2kn/EZn+x9/0aL+0p/wCDz4X/APzRUv8AUTH/APQdg/ur/wDyoP8AV3Ff8/8AD/8AlX/5WH/EZn+x9/0aL+0p/wCDz4Xf/NFR/qJj/wDoOwf3V/8A5UH+ruK/5/4f/wAq/wDysP8AiMz/AGPv+jRf2lP/AAefC/8A+aKj/UTH/wDQdg/ur/8AyoP9XcV/z/w//lX/AOVh/wARmX7H3/Rov7Sn/g8+F/8A80VH+omP/wCg3B/dX/8AlQv9XcV/z/w//lT/AOQF/wCIzL9j7/o0b9pP/wAHnwv/APmio/1Ex/8A0G4P7q//AMrH/q7iv+f9D/yp/wDIH4G/8Fnf+Divx/8A8FOfhtZ/s3/Cf4VXfwG/Z0bXNL8SeNrTXvEVv4n+IHxQ1Xw/eJqPhu01y50yz0/RPD3hTRNUjt9Zj8OWQ1u5v9e07StWudeSOwg01PpMg4Wp5RWeLr11icVyuNPli4U6KmnGbjduU5Si+XmkopRcko63PVy3J1g5+2qTVSrZqPKnGME97Xd5SfdpWTtbqfzSV9fHqe41cMVdxcq8wxRcOVeYYouHKvMMUXDlXmGKLhyrzDFFw5V5hii4cq8wxRcOVeYYouHKvMMUXDlXmQUigoAKACgAoAKAJR0H0FHL5kPdhRy+Ygo5fMAo5fMAo5fMAo5fMAo5fMBRUtWLjt8x1EeowqgCgAoAKACgAoAKACgAoAKAK9ABQAUAFABQAUASjoPoKZm936i0wCgAoAKACgAoAUVEuhcdvmLSj1GFUAUAFABQAUAFABQAUAFABQBXoAKACgAoAKACgCUdB9BTM3u/UWmAUAFABQAUAFACiol0Ljt8xaUeowqgCgAoAKACgAoAKACgAoAKAK9ABQAUAFABQAUASjoPoKZm936i0wCgAoAKACgAoAUVEuhcdvmLSj1GFUAUAFABQAUAFABQAUAFABQBXoAKACgAoAKACgCUdB9BTM3u/UWmAUAFABQAUAFACiol0Ljt8xaUeowqgCgAoAKACgAoAKACgAoAKAK9ABQAUAFABQAUASjoPoKZm936i0wCgAoAKACgAoAUVEuhcdvmLSj1GFUAUAFABQAUAFABQAUAFABQAP/Z"
        }

        if (entryPoint === entryPoint07Address) {
            return {
                ...singletonPaymasterV07.getDummyPaymasterData({
                    mode: "verifying"
                }),
                paymasterVerificationGasLimit: toHex(50_000n),
                paymasterPostOpGasLimit: toHex(100_000n),
                sponsor: sponsorData,
                isFinal: false
            }
        }

        if (entryPoint === entryPoint06Address) {
            return {
                ...singletonPaymasterV06.getDummyPaymasterData({
                    mode: "verifying"
                }),
                sponsor: sponsorData,
                isFinal: false
            }
        }

        throw new RpcError(
            "EntryPoint not supported",
            ValidationErrors.InvalidFields
        )
    }

    if (parsedBody.method === "pm_getPaymasterData") {
        const params = pmGetPaymasterData.safeParse(parsedBody.params)

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [userOperation, entryPoint] = params.data

        if (entryPoint === entryPoint07Address) {
            return await handleMethodV07(
                userOperation as UserOperation<"0.7">,
                { mode: "verifying" },
                bundler,
                singletonPaymasterV07,
                false
            )
        }

        if (entryPoint === entryPoint06Address) {
            return await handleMethodV06(
                userOperation,
                { mode: "verifying" },
                bundler,
                singletonPaymasterV06,
                false
            )
        }

        throw new RpcError(
            "EntryPoint not supported",
            ValidationErrors.InvalidFields
        )
    }

    if (parsedBody.method === "pm_validateSponsorshipPolicies") {
        return [
            {
                sponsorshipPolicyId: "sp_crazy_kangaroo",
                data: {
                    name: "Free ops for devs",
                    author: "foo",
                    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==",
                    description: "Free userOps :)"
                }
            }
        ]
    }

    if (parsedBody.method === "pimlico_getTokenQuotes") {
        const params = pimlicoGetTokenQuotesSchema.safeParse(parsedBody.params)

        if (!params.success) {
            throw new RpcError(
                fromZodError(params.error).message,
                ValidationErrors.InvalidFields
            )
        }

        const [context, entryPoint] = params.data
        const { tokens } = context

        const quotes = {
            [getAddress("0xffffffffffffffffffffffffffffffffffffffff")]: {
                exchangeRateNativeToUsd: "0x5cc717fbb3450c0000000",
                exchangeRate: "0x5cc717fbb3450c0000",
                postOpGas: "0xc350"
            }
        }

        let paymaster: Address
        if (entryPoint === entryPoint07Address) {
            paymaster = singletonPaymasterV07.singletonPaymaster.address
        } else {
            paymaster = singletonPaymasterV06.singletonPaymaster.address
        }

        return {
            quotes: tokens
                .filter((t) => quotes[t]) // Filter out unrecongized tokens
                .map((token) => ({
                    ...quotes[token],
                    paymaster,
                    token
                }))
        }
    }

    throw new RpcError(
        `Attempted to call an unknown method ${parsedBody.method}`,
        ValidationErrors.InvalidFields
    )
}

export const createRpcHandler = (
    bundler: BundlerClient,
    singletonPaymasterV07: SingletonPaymasterV07,
    singletonPaymasterV06: SingletonPaymasterV06
) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
        const body = request.body
        const parsedBody = jsonRpcSchema.safeParse(body)
        if (!parsedBody.success) {
            throw new RpcError(
                fromZodError(parsedBody.error).message,
                ValidationErrors.InvalidFields
            )
        }

        try {
            const result = await handleMethod(
                bundler,
                singletonPaymasterV07,
                singletonPaymasterV06,
                parsedBody.data
            )

            return {
                jsonrpc: "2.0",
                id: parsedBody.data.id,
                result
            }
        } catch (err: unknown) {
            console.log(`JSON.stringify(err): ${util.inspect(err)}`)

            const error = {
                // biome-ignore lint/suspicious/noExplicitAny:
                message: (err as any).message,
                // biome-ignore lint/suspicious/noExplicitAny:
                data: (err as any).data,
                // biome-ignore lint/suspicious/noExplicitAny:
                code: (err as any).code ?? -32603
            }

            return {
                jsonrpc: "2.0",
                id: parsedBody.data.id,
                error
            }
        }
    }
}
