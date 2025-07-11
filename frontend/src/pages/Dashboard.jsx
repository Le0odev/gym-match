import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dumbbell, User, MapPin, Target, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-xl font-bold text-gray-900">WorkoutPartner</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Olá, {user?.name}! 👋
          </h2>
          <p className="text-gray-600">
            Bem-vindo ao seu painel. Aqui você pode gerenciar seu perfil e encontrar parceiros de treino.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Meu Perfil
              </CardTitle>
              <CardDescription>
                Informações básicas do seu perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm">{user?.email}</p>
              </div>
              {user?.height && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Altura</p>
                  <p className="text-sm">{user.height} cm</p>
                </div>
              )}
              {user?.weight && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Peso</p>
                  <p className="text-sm">{user.weight} kg</p>
                </div>
              )}
              {user?.goal && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Objetivo</p>
                  <p className="text-sm">{user.goal}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Localização
              </CardTitle>
              <CardDescription>
                Configure sua localização para encontrar parceiros próximos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Atualizar Localização
              </Button>
            </CardContent>
          </Card>

          {/* Workout Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Preferências de Treino
              </CardTitle>
              <CardDescription>
                Defina seus tipos de treino favoritos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user?.workoutPreferences?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.workoutPreferences.map((pref) => (
                      <Badge key={pref.id} variant="secondary">
                        {pref.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhuma preferência definida
                  </p>
                )}
                <Button className="w-full mt-3" variant="outline">
                  Configurar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/discover">
              <Button className="h-20 flex flex-col items-center justify-center w-full">
                <Dumbbell className="h-6 w-6 mb-2" />
                Encontrar Parceiros
              </Button>
            </Link>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <User className="h-6 w-6 mb-2" />
              Editar Perfil
            </Button>
            <Link to="/matches">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center w-full">
                <MapPin className="h-6 w-6 mb-2" />
                Meus Matches
              </Button>
            </Link>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Target className="h-6 w-6 mb-2" />
              Configurações
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

