import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { UserService } from '../../../_services/user.service';
import { UsuariosDto } from '../../../_interfaces/user';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-table-users',
  imports: [RouterLink, CommonModule,FormsModule],
  templateUrl: './table-users.component.html',
  styleUrl: './table-users.component.css'
})
export class TableUsersComponent implements OnInit, OnDestroy {

  private userService = inject(UserService);
  private router = inject(Router);
  private subscriptions = new Subscription();

  paginatedUsers: UsuariosDto[] = [];
  usersCurrentPage = 0;
  usersItemsPerPage = 12;
  usersTotalPages = 0;
  usersSortColumn = 'username';
  sortColumnDirection: 'ASC' | 'DESC' = 'DESC';
 // usersSearchTerm = '';
  isLoading = true;

  ngOnInit(): void {
    // Suscribimos a currentSearchTerm para que cualquier cambio dispare la búsqueda
    this.subscriptions.add(
      this.userService.currentSearchTerm$
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(term => {
          this.usersCurrentPage = 0;
          this.loadUsers();
        })
    );
    
    // Suscripción al estado global de usuarios
    this.subscriptions.add(
      this.userService.myUsersPageState$.subscribe(state => {
        if (state) {
          this.paginatedUsers = state.content;
          this.usersCurrentPage = state.page.number;
          this.usersTotalPages = state.page.totalPages;
          this.usersItemsPerPage = state.page.size;
        } else {
          this.paginatedUsers = [];
        }
        this.isLoading = false;
      })
    );

    // Carga inicial
  //  this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.userService.resetSearchTerm()
  }

  loadUsers(page: number = this.usersCurrentPage): void {
    this.isLoading = true;

    const order = ['ACTIVO', 'INACTIVO', 'BANEADO', 'admin', 'user', 'organizer'].includes(this.usersSortColumn.toUpperCase()) ? undefined : this.sortColumnDirection;
    let searchTerm = this.userService.currentSearchTermValue;

    

    if (['activo','inactivo','baneado'].includes(searchTerm.toLowerCase())) {
      searchTerm = searchTerm.toUpperCase();
    } else if (['admin','user','organizer'].includes(searchTerm.toLowerCase())) {
      searchTerm = searchTerm.toLowerCase();
    }

    const sub = (searchTerm
      ? this.userService.getUsersBySearchTerm(searchTerm, page, this.usersItemsPerPage, this.usersSortColumn, order)
      : this.userService.getUsers(page, this.usersItemsPerPage, order, this.usersSortColumn)
    ).subscribe({
      next: (usersPage) => {
        this.paginatedUsers = usersPage.content;
        this.usersTotalPages = usersPage.page.totalPages;
        this.usersCurrentPage = usersPage.page.number;
        this.isLoading = false;
      },
      error: () => {
        this.paginatedUsers = [];
        this.isLoading = false;
      }
    });

    this.subscriptions.add(sub);
  }

toggleSortUsers(column: string): void {
  const specialColumns = ['userStatus','role'];

  if (specialColumns.includes(column)) {
    // Si se pulsa la misma columna de nuevo, alterna ASC/DESC
    this.sortColumnDirection = this.usersSortColumn === column
      ? (this.sortColumnDirection === 'ASC' ? 'DESC' : 'ASC')
      : 'ASC';

    this.usersSortColumn = column;

  } else {
    this.sortColumnDirection = this.usersSortColumn === column
      ? (this.sortColumnDirection === 'ASC' ? 'DESC' : 'ASC')
      : 'ASC';

    this.usersSortColumn = column;
  }

  this.loadUsers();
}


  onUserSearch(term: string): void {
    this.userService.setSearchTerm(term);
    this.usersCurrentPage = 0;
    //this.loadUsers();
  }

  changeUserPage(page: number): void {
    const backendPage = page - 1;
    if(backendPage < 0 || backendPage >= this.usersTotalPages) {
      return;
    }
    this.usersCurrentPage = backendPage;
    this.loadUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getUserPageNumbers(): number[] {
    return Array(this.usersTotalPages).fill(0).map((_,i) => i+1);
  }

  get displayUserCurrentPage(): number {
    return this.usersCurrentPage + 1;
  }

  changeUserRole(user: UsuariosDto, newRole: string): void {
    Swal.fire({
      title: '¿Cambiar rol?',
      text: `El usuario "${user.username}" pasará a rol "${newRole}".`,
      icon: 'question',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      background: 'linear-gradient(135deg, #F95596, #FE7079)',
      color: 'white',
      iconColor: 'white',
      confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
    }).then((result) => {
      if(result.isConfirmed) {
        this.userService.updateUserRole(user.username, newRole).subscribe({
          next: () => {
            user.role = newRole;
          Swal.fire({
            title: 'Rol actualizado',
            text: 'El rol del usuario cambió correctamente.',
            icon: 'success',
            background: 'linear-gradient(135deg, #F95596, #FE7079)',
            color: 'white',
            iconColor: 'white',
            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
          });          },
        error: (err) => Swal.fire({
          title: 'Error',
          text: err?.error?.message || 'No se pudo cambiar el rol',
          icon: 'error',
          background: 'linear-gradient(135deg, #F95596, #FE7079)',
          color: 'white',
          iconColor: 'white',
          confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
        })
              });
      }
    });
  }

  changeUserStatus(user: UsuariosDto, newStatus: string): void {
    Swal.fire({
        title: '¿Cambiar estatus?',
        text: `El usuario "${user.username}" pasará a estado "${newStatus}".`,
        icon: 'question',
        showCancelButton: true,
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar',
        background: 'linear-gradient(135deg, #F95596, #FE7079)',
        color: 'white',
        iconColor: 'white',
        confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
    }).then((result) => {
      if(result.isConfirmed) {
        this.userService.updateUserStatus(user.username, newStatus).subscribe({
          next: () => {
            user.userStatus = newStatus;
          Swal.fire({
            title: 'Estatus actualizado',
            text: 'El estatus cambió correctamente',
            icon: 'success',
            background: 'linear-gradient(135deg, #F95596, #FE7079)',
            color: 'white',
            iconColor: 'white',
            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
          });          },
        error: (err) => Swal.fire({
          title: 'Error',
          text: err?.error?.message || 'No se pudo cambiar el estatus',
          icon: 'error',
          background: 'linear-gradient(135deg, #F95596, #FE7079)',
          color: 'white',
          iconColor: 'white',
          confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
        })
              });
      }
    });
  }

  deleteUser(user: UsuariosDto): void {
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Se eliminará el usuario "${user.username}"`,
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'linear-gradient(135deg, #F95596, #FE7079)',
      color: 'white',
      iconColor: 'white',
      confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
    }).then((result) => {
      if(result.isConfirmed) {
        this.userService.deleteUserFromAdminUsers(user.username).subscribe({
          next: () => {
            Swal.fire({
              title: 'Usuario eliminado',
              text: 'El usuario se eliminó correctamente',
              icon: 'success',
              background: 'linear-gradient(135deg, #F95596, #FE7079)',
              color: 'white',
              iconColor: 'white',
              confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
            });
             this.loadUsers();
          },
          error: (err) => Swal.fire({
            title: 'Error',
            text: err?.error?.message || 'Error al eliminar usuario',
            icon: 'error',
            background: 'linear-gradient(135deg, #F95596, #FE7079)',
            color: 'white',
            iconColor: 'white',
            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
          })
              });
      }
    });
  }

  editUser(user: UsuariosDto): void {
    this.router.navigate(['/usuarios/edit', user.username]);
  }
}
