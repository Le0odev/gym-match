import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { matchesAPI, workoutPreferencesAPI } from '../services/api';
import UserCard from '../components/discover/UserCard';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dumbbell, Settings, RefreshCw, Heart } from 'lucide-react';

const Discover = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [workoutPreferences, setWorkoutPreferences] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    distance: 10,
    workoutType: '',
    minHeight: '',
    maxHeight: '',
    minWeight: '',
    maxWeight: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadWorkoutPreferences();
    loadUsers();
  }, []);

  const loadWorkoutPreferences = async () => {
    try {
      const response = await workoutPreferencesAPI.getAll();
      setWorkoutPreferences(response.data);
    } catch (error) {
      console.error('Failed to load workout preferences:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await matchesAPI.discover(filters);
      setUsers(response.data);
      setCurrentUserIndex(0);
      setMessage('');
    } catch (error) {
      console.error('Failed to load users:', error);
      setMessage('Erro ao carregar usuários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (userId) => {
    setActionLoading(true);
    try {
      const response = await matchesAPI.like(userId);
      
      if (response.data.matchStatus === 'accepted') {
        setMessage('🎉 É um match! Vocês se curtiram mutuamente!');
      } else {
        setMessage('❤️ Curtida enviada!');
      }
      
      moveToNextUser();
    } catch (error) {
      console.error('Failed to like user:', error);
      setMessage('Erro ao curtir usuário. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (userId) => {
    setActionLoading(true);
    try {
      await matchesAPI.skip(userId);
      moveToNextUser();
    } catch (error) {
      console.error('Failed to skip user:', error);
      setMessage('Erro ao pular usuário. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const moveToNextUser = () => {
    if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
    } else {
      // No more users, reload
      loadUsers();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadUsers();
    setShowFilters(false);
  };

  const currentUser = users[currentUserIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Descobrir Parceiros</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button
                variant="outline"
                onClick={loadUsers}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros de Busca</CardTitle>
              <CardDescription>
                Personalize sua busca por parceiros de treino
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distância (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    value={filters.distance}
                    onChange={(e) => handleFilterChange('distance', Number(e.target.value))}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workoutType">Tipo de Treino</Label>
                  <Select
                    value={filters.workoutType}
                    onValueChange={(value) => handleFilterChange('workoutType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {workoutPreferences.map((pref) => (
                        <SelectItem key={pref.id} value={pref.id}>
                          {pref.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={filters.minHeight}
                      onChange={(e) => handleFilterChange('minHeight', Number(e.target.value))}
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      value={filters.maxHeight}
                      onChange={(e) => handleFilterChange('maxHeight', Number(e.target.value))}
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={filters.minWeight}
                      onChange={(e) => handleFilterChange('minWeight', Number(e.target.value))}
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      value={filters.maxWeight}
                      onChange={(e) => handleFilterChange('maxWeight', Number(e.target.value))}
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={applyFilters}>
                  Aplicar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="flex justify-center">
          {loading ? (
            <Card className="w-full max-w-sm">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Procurando parceiros...</p>
                </div>
              </CardContent>
            </Card>
          ) : currentUser ? (
            <UserCard
              user={currentUser}
              onLike={handleLike}
              onSkip={handleSkip}
              loading={actionLoading}
            />
          ) : (
            <Card className="w-full max-w-sm">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum parceiro encontrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar seus filtros ou volte mais tarde
                  </p>
                  <Button onClick={loadUsers}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress */}
        {users.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {currentUserIndex + 1} de {users.length} usuários
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentUserIndex + 1) / users.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Discover;

