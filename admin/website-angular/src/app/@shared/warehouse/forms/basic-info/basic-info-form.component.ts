import { Component, Input, ViewChild, OnInit } from '@angular/core';
import {
	AbstractControl,
	FormBuilder,
	FormControl,
	FormGroup,
	Validators
} from '@angular/forms';
import { IWarehouseCreateObject } from '@modules/server.common/interfaces/IWarehouse';
import { map, first } from 'rxjs/operators';
import { CarrierRouter } from '@modules/client.common.angular2/routers/carrier-router.service';
import { IMultiSelectOption } from 'angular-2-dropdown-multiselect';
import { Observable, concat } from 'rxjs';
import { pick } from 'lodash';
import { FormHelpers } from '../../../forms/helpers';
import { getDummyImage } from '@modules/server.common/utils';
import { TranslateService } from '@ngx-translate/core';

export type WarehouseBasicInfo = Pick<
	IWarehouseCreateObject,
	| 'name'
	| 'logo'
	| 'isActive'
	| 'username'
	| 'hasRestrictedCarriers'
	| 'usedCarriersIds'
>;

@Component({
	selector: 'ea-warehouse-basic-info-form',
	styleUrls: ['basic-info-form.component.scss'],
	templateUrl: 'basic-info-form.component.html'
})
export class BasicInfoFormComponent implements OnInit {
	@ViewChild('fileInput')
	fileInput: any;

	@Input()
	readonly form: FormGroup;
	@Input()
	readonly password?: AbstractControl;

	uploaderPlaceholder: string;

	carriersOptions$: Observable<IMultiSelectOption[]> = concat(
		Observable.of([]),
		this.carrierRouter.getAllActive().pipe(
			map((carriers) =>
				carriers.map((c) => {
					return {
						id: c.id,
						name: `${c.firstName} ${c.lastName}`
					};
				})
			)
		)
	);

	static buildForm(formBuilder: FormBuilder): FormGroup {
		// would be used in the parent component and injected into this.form
		return formBuilder.group({
			name: [
				'',
				[
					Validators.required,
					Validators.minLength(3),
					Validators.maxLength(255)
				]
			],
			logo: [
				'',
				[
					(control: AbstractControl) => {
						const isEmpty = control.value === '';
						if (!isEmpty) {
							if (
								!control.value.startsWith('http') ||
								control.value.match(
									/s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|gif|png|svg))/
								) === null
							) {
								return { validUrl: true };
							}
						}
						return null;
					}
				]
			],
			isActive: [true, [Validators.required]],
			username: ['', [Validators.required]],

			hasRestrictedCarriers: [false, [Validators.required]],
			usedCarriersIds: [[]]
		});
	}

	static buildPasswordForm(formBuilder: FormBuilder): AbstractControl {
		return new FormControl('', [Validators.required]);
	}

	getValue(): WarehouseBasicInfo {
		const basicInfo = this.form.getRawValue() as {
			name: string;
			logo: string;
			isActive: boolean;
			username: string;

			hasRestrictedCarriers: boolean;
			usedCarriersIds: string[];
		};

		if (!basicInfo.logo) {
			const letter = basicInfo.name.charAt(0).toUpperCase();
			basicInfo.logo = getDummyImage(300, 300, letter);
		}

		return {
			isActive: basicInfo.isActive,
			name: basicInfo.name,
			username: basicInfo.username,
			logo: basicInfo.logo,
			...(basicInfo.hasRestrictedCarriers
				? {
						hasRestrictedCarriers: basicInfo.hasRestrictedCarriers,
						usedCarriersIds: basicInfo.usedCarriersIds
				  }
				: {})
		};
	}

	setValue<T extends WarehouseBasicInfo>(basicInfo: T) {
		FormHelpers.deepMark(this.form, 'dirty');

		this.form.setValue(
			pick(basicInfo, [
				...Object.keys(this.getValue()),
				'hasRestrictedCarriers',
				'usedCarriersIds'
			])
		);
	}

	getPassword(): string {
		// password is not part of warehouse
		if (!this.password) {
			throw new Error("Form doesn't contain password");
		}
		return this.password.value as string;
	}

	setPassword(value: string) {
		this.password.setValue(value);
	}

	constructor(
		private readonly carrierRouter: CarrierRouter,
		private readonly translateService: TranslateService
	) {}

	get name() {
		return this.form.get('name');
	}

	get logo() {
		return this.form.get('logo');
	}

	get isActive() {
		return this.form.get('isActive');
	}

	get username() {
		return this.form.get('username');
	}

	get hasRestrictedCarriers() {
		return this.form.get('hasRestrictedCarriers');
	}

	get usedCarriersIds() {
		return this.form.get('usedCarriersIds');
	}

	get showLogoMeta() {
		return this.logo && this.logo.value !== '';
	}

	ngOnInit(): void {
		this.getUploaderPlaceholderText();
	}

	deleteImg() {
		this.logo.setValue('');
	}

	private async getUploaderPlaceholderText() {
		const res = await this.translateService
			.get(['WAREHOUSE_VIEW.MUTATION.PHOTO', 'OPTIONAL'])
			.pipe(first())
			.toPromise();

		this.uploaderPlaceholder = `${res['WAREHOUSE_VIEW.MUTATION.PHOTO']} (${
			res['OPTIONAL']
		})`;
	}
}
