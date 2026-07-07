import QRCode from 'qrcode';

export interface ICreateQrDataUrlInput {
	payload: string;
}

export const createQrDataUrl = async ({ payload }: ICreateQrDataUrlInput): Promise<string> => {
	return QRCode.toDataURL(payload, {
		errorCorrectionLevel: 'M',
		margin: 1,
		width: 320,
		color: {
			dark: '#111827',
			light: '#ffffff'
		}
	});
};
