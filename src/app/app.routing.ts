import {Routes} from '@angular/router';
import {AdminLayoutComponent} from './layouts/admin/admin-layout.component';
import { PageNotFoundComponent } from './components/page-not-found.component';

export const AppRoutes: Routes = [{
  path: '',
  component: AdminLayoutComponent,
  children: [
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full',
    }, {
      path: 'auth',
      loadChildren: './auth/auth.module#AuthModule'
    }, {
      path: 'dashboard',
      loadChildren: './dashboard/dashboard.module#DashboardModule',
    }, {
      path: 'users',
      loadChildren: './users/user.module#UserModule',
    }, {
      path: 'audits',
      loadChildren: './audits/audit.module#AuditModule',
    }, {
      path: 'enviroments',
      loadChildren: './enviroments/enviroment.module#EnviromentModule',
    }, {
      path: 'enviromentstype',
      loadChildren: './enviroments-type/enviroment-type.module#EnviromentTypeModule',
    }, {
      path: 'questions',
      loadChildren: './questions/question.module#QuestionModule',
    }, {
      path: 'units',
      loadChildren: './units/unit.module#UnitModule',
    }
  ]
}, {
  path: '**',
  component: PageNotFoundComponent 
}];
