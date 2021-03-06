import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl } from '@angular/forms';
import { StatesService } from 'src/app/services/states.service';
import { Router, ActivatedRoute } from '@angular/router';
import { BridgeService } from 'src/app/services/bridge.service';
import { ErrorInterface, UserInterface } from '@osmo6/models';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { LegalComponent } from '../legal/legal.component';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit { // contient les var du component

    /** Lorque l'utilisateur click sur le btn connexion */
    public isLogin = false;

    /** Lorque l'utilisateur click sur le btn inscription */
    public isRegistered = false;

    /** Lorsque l'utilisateur arrive sur le site */
    public isHome = true;

    /** */
    public hide = true;

    /** Token utilisateur */
    public token: string;

    /** Formulaire de connexion */
    formConnect: FormGroup = this.formBuild.group({
        email: new FormControl('', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$')]),
        pass: new FormControl('', [Validators.required]),
    });

    /** Formulaire d'inscription */
    formResistered: FormGroup = this.formBuild.group({
        email: new FormControl('', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$')]),
        name: new FormControl('', [Validators.required]),
        pass: new FormControl('', [
            Validators.required,
            Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/)
        ]),
        passConfirm: new FormControl('', [Validators.required]),
        rgpd: new FormControl('', [Validators.required])
    }, {validators: this.passwordConfirming});

    constructor(private formBuild: FormBuilder,
                private stateService: StatesService,
                private bridgeService: BridgeService,
                private route: Router,
                private activeRoute: ActivatedRoute,
                public dialog: MatDialog) { }

    ngOnInit() {
        this.activeRoute.queryParams.subscribe(res => {
            this.token = res.t;
            if (this.token) {
                localStorage.clear();
                // Si on est sur la route d'auth et qu'on a un token en paramètre, on lance l'activation du compte
                if (Object.keys(res).length > 0 && res.t !== undefined) {
                    this.bridgeService.activateUser(this.token).subscribe(response => {
                        if (this.stateService.checkStatus(response.status)) {
                            this.route.navigate(['/auth']);
                            this.effectBtn('connexion');
                            // On redirige, on préremplie le champ mail et on affiche un message de succès
                            this.formConnect.get('email').setValue(response.data.email);
                            this.stateService.openSnackBar(response.message, null);
                        } else {
                            const err: ErrorInterface = {
                                code: response.status,
                                message: response.message,
                                route: `${environment.apiUrlService}user/activate/${this.token}`
                            };
                            this.stateService.openSnackBar(err.message, null, 'err');
                            this.stateService.errors = err;
                            localStorage.clear();
                        }
                    });
                }
            }
        });
    }

    /**
     * Permet de controler les mots de passe
     * @param c formControl
     */
    public passwordConfirming(c: AbstractControl) {
        if (c.get('pass').value !== c.get('passConfirm').value) {
            return {matchPassword: true};
        }
    }

   /**
    * Permet de switcher entre l'inscrip^tion/la connexion ou la page d'accueil
    * @param value string
    */
    effectBtn(value: string) {
        switch (value) {
            case 'inscription':
            this.isHome = false;
            this.isLogin = false;
            this.isRegistered = true;
            break;

            case 'connexion':
            this.isHome = false;
            this.isLogin = true;
            this.isRegistered = false;
            break;

            case 'retour':
            this.isHome = true;
            this.isLogin = false;
            this.isRegistered = false;
            break;

            default:
            break;
        }
    }

   /**
    * Permet à l'utilisateur de se connecter au site
    */
    login() {
        if (this.formConnect.valid) {
            const email = this.formConnect.value.email;
            const pass = this.formConnect.value.pass;
            // const email = 'mail@mail.com';
            // const pass = 'motdepasse';

            this.bridgeService.login(email, pass).subscribe(res => {
                if (this.stateService.checkStatus(res.status)) {
                    const data: UserInterface = res.data;
                    this.stateService.userProfil = data;
                    this.bridgeService.getGarmentUser(data.id_user);
                    this.bridgeService.getAllOutfit(data.id_user);
                    this.stateService.login();
                    localStorage.clear();
                } else {
                    const err: ErrorInterface = {code: res.status, message: res.message, route: environment.apiUrlService + 'user/login'};
                    this.stateService.errors = err;
                    this.stateService.openSnackBar(err.message, null, 'err');
                }
            });
        } else {
            this.formConnect.markAllAsTouched();
        }
    }

    register() {
        console.log(this.formResistered.controls.rgpd);
        if (this.formResistered.valid) {
            localStorage.clear();
            this.bridgeService.register({
                name: this.formResistered.value.name,
                mail: this.formResistered.value.email,
                pass: this.formResistered.value.pass
            }).subscribe(res => {
                if (this.stateService.checkStatus(res.status)) {
                    this.stateService.openSnackBar('Un mail d\'activation vous a été envoyé', null);
                } else {
                    const err: ErrorInterface = {
                        code: res.status,
                        message: res.message,
                        route: `${environment.apiUrlService}user/add`
                    };
                    this.stateService.errors = err;
                    this.stateService.openSnackBar(err.message, null, 'err');
                }
            });
        } else {
            this.formResistered.markAllAsTouched();
        }
    }

    legal() {
        const dialogRef = this.dialog.open(LegalComponent, {
            width: '60%',
        });
    }
}
