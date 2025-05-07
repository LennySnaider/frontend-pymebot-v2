/**
 * frontend/src/app/(protected-pages)/modules/account/roles-permissions/_components/PermissionGuideExample.tsx
 * Componente de ejemplo que muestra cómo utilizar los diferentes componentes de permisos.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  PermissionGate, 
  VerticalGate, 
  ModuleGate, 
  FeatureGate, 
  RoleGate,
  PermissionButton,
  withPermission
} from '@/components/core/permissions';
import usePermissions from '@/lib/core/permissions';

const PermissionGuideExample = () => {
  const { role } = usePermissions();
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">Guía de Uso de Componentes de Permisos</h2>
      
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-3">1. Uso de RoleGate</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          El componente RoleGate permite mostrar contenido basado en el rol del usuario.
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
          <p className="font-mono text-sm mb-2">Tu rol actual: <span className="text-blue-600 dark:text-blue-400 font-semibold">{role}</span></p>
          
          <div className="space-y-2">
            <RoleGate 
              allowedRoles="super_admin"
              fallback={<p className="text-gray-500">Este contenido solo es visible para super_admin</p>}
            >
              <p className="text-green-600 dark:text-green-400">
                ✅ Eres super_admin y puedes ver este contenido.
              </p>
            </RoleGate>
            
            <RoleGate 
              allowedRoles={['super_admin', 'tenant_admin']}
              fallback={<p className="text-gray-500">Este contenido es visible para super_admin o tenant_admin</p>}
            >
              <p className="text-green-600 dark:text-green-400">
                ✅ Eres super_admin o tenant_admin y puedes ver este contenido.
              </p>
            </RoleGate>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Ejemplo de código:</h4>
          <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<RoleGate allowedRoles="super_admin">
  <AdminPanel />
</RoleGate>

<RoleGate allowedRoles={['super_admin', 'tenant_admin']}>
  <TenantSettings />
</RoleGate>`}
          </pre>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-3">2. Uso de PermissionGate</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          El componente PermissionGate permite mostrar contenido basado en permisos específicos.
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
          <div className="space-y-2">
            <PermissionGate 
              permissionType="view"
              scope={{ vertical: 'salon', module: 'clients' }}
              fallback={<p className="text-gray-500">No tienes permisos para ver clientes en la vertical de salon</p>}
            >
              <p className="text-green-600 dark:text-green-400">
                ✅ Tienes permisos para ver clientes en la vertical de salon.
              </p>
            </PermissionGate>
            
            <PermissionGate 
              permissionType={['edit', 'create']}
              scope={{ vertical: 'salon', module: 'clients' }}
              fallback={<p className="text-gray-500">No tienes permisos para editar o crear clientes</p>}
            >
              <p className="text-green-600 dark:text-green-400">
                ✅ Tienes permisos para editar o crear clientes.
              </p>
            </PermissionGate>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Ejemplo de código:</h4>
          <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<PermissionGate 
  permissionType="edit" 
  scope={{ vertical: 'salon', module: 'clients' }}
>
  <EditClientForm />
</PermissionGate>

<PermissionGate 
  permissionType={['view', 'edit']} 
  scope={{ module: 'reports' }}
  fallback={<ReadOnlyView />}
>
  <EditableReports />
</PermissionGate>`}
          </pre>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-3">3. Uso de VerticalGate y ModuleGate</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Estos componentes permiten controlar el acceso a verticales y módulos específicos.
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
          <div className="space-y-2">
            <VerticalGate 
              verticalCode="salon"
              fallback={<p className="text-gray-500">No tienes acceso a la vertical de salon</p>}
            >
              <p className="text-green-600 dark:text-green-400">
                ✅ Tienes acceso a la vertical de salon.
              </p>
              
              <div className="pl-4 mt-2 border-l-2 border-gray-300 dark:border-gray-600">
                <ModuleGate 
                  verticalCode="salon"
                  moduleCode="appointments"
                  fallback={<p className="text-gray-500">No tienes acceso al módulo de citas</p>}
                >
                  <p className="text-green-600 dark:text-green-400">
                    ✅ Tienes acceso al módulo de citas dentro de salon.
                  </p>
                </ModuleGate>
              </div>
            </VerticalGate>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Ejemplo de código:</h4>
          <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<VerticalGate verticalCode="restaurant">
  <RestaurantDashboard>
    <ModuleGate 
      verticalCode="restaurant"
      moduleCode="menu"
    >
      <MenuManager />
    </ModuleGate>
  </RestaurantDashboard>
</VerticalGate>`}
          </pre>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-3">4. Uso de FeatureGate</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          El componente FeatureGate permite controlar el acceso a características específicas.
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
          <div className="space-y-2">
            <FeatureGate 
              featureCode="feature_advanced_reports"
              fallback={
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 p-3 rounded-md">
                  ⚠️ Esta característica requiere un plan Premium. 
                  <Button size="sm" className="ml-2" variant="outline">Actualizar Plan</Button>
                </div>
              }
            >
              <p className="text-green-600 dark:text-green-400">
                ✅ Tienes acceso a la característica de reportes avanzados.
              </p>
            </FeatureGate>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Ejemplo de código:</h4>
          <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<FeatureGate 
  featureCode="feature_billing_management"
  fallback={<UpgradePlanMessage />}
>
  <BillingManager />
</FeatureGate>`}
          </pre>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-3">5. Uso de PermissionButton</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          El componente PermissionButton permite controlar botones basados en permisos.
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium mb-2">Botones que se deshabilitan:</h5>
              <div className="flex space-x-2">
                <PermissionButton
                  permissionType="create"
                  scope={{ vertical: 'salon', module: 'clients' }}
                  variant="solid"
                >
                  Crear Cliente
                </PermissionButton>
                
                <PermissionButton
                  permissionType="delete"
                  scope={{ vertical: 'salon', module: 'appointments' }}
                  variant="solid"
                  color="red"
                >
                  Eliminar Cita
                </PermissionButton>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">Botones que se ocultan:</h5>
              <div className="flex space-x-2">
                <PermissionButton
                  permissionType="manage"
                  scope={{ module: 'billing' }}
                  hideOnNoPermission
                  variant="outline"
                >
                  Gestionar Facturación
                </PermissionButton>
                
                <PermissionButton
                  permissionType="approve"
                  scope={{ vertical: 'medical', module: 'prescriptions' }}
                  hideOnNoPermission
                  variant="outline"
                  color="green"
                >
                  Aprobar Receta
                </PermissionButton>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Ejemplo de código:</h4>
          <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<PermissionButton 
  permissionType="create" 
  scope={{ vertical: 'salon', module: 'clients' }}
  variant="primary"
>
  Crear Cliente
</PermissionButton>

<PermissionButton 
  permissionType="delete" 
  scope={{ vertical: 'restaurant', module: 'menu' }}
  variant="danger"
  hideOnNoPermission
>
  Eliminar Elemento
</PermissionButton>`}
          </pre>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-3">6. Uso del HOC withPermission</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          El HOC withPermission permite proteger componentes completos verificando permisos.
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Este HOC es útil para proteger componentes completos. A continuación se muestra un ejemplo conceptual:
            </p>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 p-3 rounded-md">
              El componente AdminSettingsPanel solo es accesible para usuarios con permisos de gestión en el módulo de configuración.
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
          <h4 className="font-semibold mb-2">Ejemplo de código:</h4>
          <pre className="bg-gray-800 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { withPermission } from '@/components/core/permissions';
import RestrictedAccessMessage from '@/components/ui/RestrictedAccessMessage';

// Componente base
const AdminSettingsPanel = ({ title }) => {
  return <div>Panel de configuración: {title}</div>;
};

// Componente protegido con withPermission
const ProtectedAdminPanel = withPermission({
  permissionType: 'manage',
  scope: { module: 'settings' },
  FallbackComponent: RestrictedAccessMessage
})(AdminSettingsPanel);

// Uso
const App = () => {
  return <ProtectedAdminPanel title="Configuración General" />;
};`}
          </pre>
        </div>
      </Card>
    </div>
  );
};

export default PermissionGuideExample;
