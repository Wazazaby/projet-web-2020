import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
    SeasonInterface, TypeInterface, StyleInterface, BrandInterface, ColorInterface, GarmentColorStyleWrapperInterface, ErrorInterface
} from '@osmo6/models';
import { StatesService } from 'src/app/services/states.service';
import { ErrorStateMatcher } from '@angular/material/core';
import { BridgeService } from 'src/app/services/bridge.service';
import { environment } from 'src/environments/environment';

export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

@Component({
    selector: 'app-modal-add-garment',
    templateUrl: './modal-add-garment.component.html',
    styleUrls: ['./modal-add-garment.component.scss']
})
export class ModalAddGarmentComponent implements OnInit {

    constructor(private formBuild: FormBuilder,
                private stateService: StatesService,
                private bridgeService: BridgeService,
                @Inject(MAT_DIALOG_DATA) public data: {userId: number, garment: GarmentColorStyleWrapperInterface}) { }

    // image
    file: File;
    // url temporaire pour la preview
    url: any;

    // Champs obligatoire pour la création d'un vêtement
    formGarment: FormGroup = this.formBuild.group({
        label_garment: new FormControl('', [Validators.required]),
        user_id_user: [this.data.userId, Validators.required],
        brand_id_brand: new FormControl('', [Validators.required]),
        season_id_season: new FormControl('', [Validators.required]),
        type_id_type: new FormControl('', [Validators.required]),
        style: new FormControl('', [Validators.required]),
        colorPrim: new FormControl('', [Validators.required]),
        colorSecond: ['', []],
    });

    // matcher d'erreur input
    matcher = new MyErrorStateMatcher();

    // Etape de création d'un vêtement
    stepOne: boolean;

    // Saison
    season: SeasonInterface[] = this.stateService.season;
    type: TypeInterface[] = this.stateService.type;
    style: StyleInterface[] = this.stateService.style;
    brand: BrandInterface[] = this.stateService.brand;
    color: ColorInterface[] = this.stateService.color;

    // Vérifie si l'on peut fermer le modal
    isOk = false;

    ngOnInit() {
        if (this.data.garment !== undefined) {
            this.stepOne = false;
            this.url = environment.apiUrlBase + this.data.garment.garment.url_img_garment;
            const styles = [];
            this.data.garment.styles.forEach(s => {
                styles.push(s.id_style);
            });
            const colorSec = this.data.garment.colors[1] !== undefined ? this.data.garment.colors[1].id_color : '';

            this.formGarment.get('label_garment').setValue(this.data.garment.garment.label_garment);
            this.formGarment.get('user_id_user').setValue(this.data.garment.garment.user_id_user);
            this.formGarment.get('brand_id_brand').setValue(this.data.garment.garment.brand_id_brand);
            this.formGarment.get('season_id_season').setValue(this.data.garment.garment.season_id_season);
            this.formGarment.get('type_id_type').setValue(this.data.garment.garment.type_id_type);
            this.formGarment.get('style').setValue(styles);
            this.formGarment.get('colorPrim').setValue(this.data.garment.colors[0].id_color);
            this.formGarment.get('colorSecond').setValue(colorSec);
        } else {
            this.stepOne = true;
        }
    }

    uploadFile(event) {
        this.url = null;
        this.file = event[0];

        // Preview image
        const reader: FileReader = new FileReader();
        const acceptedImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
        reader.readAsDataURL(event[0]);
        reader.onload = (evt: any) => {
            if (evt.target && evt.target.result) {
                this.url = evt.target.result;
            }

            if (this.url && this.file && acceptedImageTypes.includes(this.file.type)) {
                if (this.file.size > 5500000) {
                    return this.stateService.openSnackBar('Le poid du fichier est trop volumineux', null, 'err');
                }
                this.stepOne = false;
            } else {
                this.stateService.openSnackBar('Le type de fichier n\'est pas valide', null, 'err');
            }
        };
    }

    removeFile() {
        this.file = null;
        this.url = null;
        this.stepOne = true;
    }

    sendFile() {
        if (this.formGarment.valid) {
            const colors = [this.formGarment.value.colorPrim];
            if (this.formGarment.value.colorSecond) {
                colors.push(this.formGarment.value.colorSecond);
            }

            const formData = new FormData();
            formData.append('url_img_garment', this.file);
            formData.append('color', JSON.stringify(colors));
            formData.append('style', JSON.stringify(this.formGarment.value.style));
            formData.append('user_id_user', this.formGarment.value.user_id_user);
            formData.append('label_garment', this.formGarment.value.label_garment);
            formData.append('brand_id_brand', this.formGarment.value.brand_id_brand);
            formData.append('season_id_season', this.formGarment.value.season_id_season);
            formData.append('type_id_type', this.formGarment.value.type_id_type);

            if (!this.data.garment) {

                this.bridgeService.addGarment(formData).subscribe(res => {
                    if (this.stateService.checkStatus(res.status)) {

                        // Nouveau garment
                        const data: GarmentColorStyleWrapperInterface = res.data;
                        // Liste des garment
                        const garment: GarmentColorStyleWrapperInterface[] = this.stateService.garment;
                        // Ajoute le garment à la liste
                        garment.push(data);
                        // refresh la liste des garment
                        this.stateService.garment = garment;
                        // Reset le formulaire & l'image
                        this.file = null;
                        this.url = '';
                        this.isOk = true;
                        this.formGarment.reset();
                    } else {
                        const err: ErrorInterface = {
                            code: res.status,
                            message: res.message,
                            route: environment.apiUrlService + this.bridgeService.userGarmentAdd
                        };
                        this.stateService.openSnackBar(err.message, null, 'err');
                        this.stateService.errors = err;
                    }
                });
            } else {
                formData.append('id_garment', JSON.stringify(this.data.garment.garment.id_garment));

                this.bridgeService.upadateGarment(formData).subscribe(res => {
                    if (this.stateService.checkStatus(res.status)) {
                        this.bridgeService.getGarmentUser(this.data.userId);
                    } else {
                        const err: ErrorInterface = {
                            code: res.status,
                            message: res.message,
                            route: environment.apiUrlService + this.bridgeService.userGarmentSet
                        };
                        this.stateService.openSnackBar(err.message, null, 'err');
                        this.stateService.errors = err;
                    }
                });
            }

        } else {
            this.formGarment.markAllAsTouched();
        }
    }
}
